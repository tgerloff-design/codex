import { parseStringPromise } from 'xml2js';
import { CanonicalWorkItem, Resource, WorkloadRequest } from '../../../shared/types';
import { config } from '../config';
import { BasicAuthProvider, DataProvider, PluggableAuthProvider, SsrsAuthProvider } from './types';

function chooseAuthProvider(): SsrsAuthProvider {
  if (config.ssrs.username && config.ssrs.password) {
    return new BasicAuthProvider(config.ssrs.username, config.ssrs.password, config.ssrs.domain || undefined);
  }

  return new PluggableAuthProvider();
}

function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length <= 1) {
    return [];
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function pickValue(record: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (record[alias] !== undefined) {
      return record[alias];
    }
  }
  return undefined;
}

function mapRecordToCanonical(record: Record<string, unknown>): CanonicalWorkItem {
  const resourceId = pickValue(record, ['resourceId', 'ResourceId', 'resource_id', 'AssigneeId']);
  const resourceName = pickValue(record, ['resourceName', 'ResourceName', 'resource_name', 'AssigneeName']);
  const workDate = pickValue(record, ['workDate', 'WorkDate', 'work_date', 'Date']);
  const workloadHours = pickValue(record, ['workloadHours', 'WorkloadHours', 'hours', 'Hours']);
  const workloadUnits = pickValue(record, ['workloadUnits', 'WorkloadUnits', 'units', 'Units']);

  return {
    resourceId: String(resourceId ?? ''),
    resourceName: String(resourceName ?? ''),
    workDate: String(workDate ?? '').slice(0, 10),
    workloadHours: workloadHours == null || workloadHours === '' ? undefined : Number(workloadHours),
    workloadUnits: workloadUnits == null || workloadUnits === '' ? undefined : Number(workloadUnits)
  };
}

async function parseXml(xml: string): Promise<Record<string, unknown>[]> {
  const parsed = await parseStringPromise(xml, { explicitArray: false, trim: true });

  const table = parsed?.Report?.Table1 ?? parsed?.root ?? parsed;
  if (!table) {
    return [];
  }

  const rows = table?.row ?? table?.Rows ?? [];
  if (Array.isArray(rows)) {
    return rows;
  }

  return [rows];
}

export class SsrsProvider implements DataProvider {
  private authProvider = chooseAuthProvider();

  private buildUrl(request: WorkloadRequest): string {
    if (!config.ssrs.baseUrl || !config.ssrs.reportPath) {
      throw new Error('Missing SSRS config. Set SSRS_BASE_URL and SSRS_REPORT_PATH.');
    }

    const params = new URLSearchParams();
    params.set('rs:Format', config.ssrs.format.toUpperCase());
    params.set('StartDate', request.startDate);
    params.set('EndDate', request.endDate);

    if (request.resourceIds.length > 0) {
      for (const id of request.resourceIds) {
        params.append('ResourceId', id);
      }
    }

    const path = config.ssrs.reportPath.startsWith('/') ? config.ssrs.reportPath : `/${config.ssrs.reportPath}`;
    return `${config.ssrs.baseUrl}${path}?${params.toString()}`;
  }

  private async fetchData(request: WorkloadRequest): Promise<CanonicalWorkItem[]> {
    const url = this.buildUrl(request);
    const headers = await this.authProvider.getHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`SSRS request failed with status ${response.status}: ${response.statusText}`);
    }

    const format = config.ssrs.format;
    if (format === 'json') {
      const json = await response.json();
      const rows = Array.isArray(json) ? json : (json?.value ?? json?.Rows ?? []);
      return rows.map((row: Record<string, unknown>) => mapRecordToCanonical(row));
    }

    if (format === 'xml') {
      const text = await response.text();
      const rows = await parseXml(text);
      return rows.map((row) => mapRecordToCanonical(row));
    }

    const text = await response.text();
    const rows = parseCsv(text);
    return rows.map((row) => mapRecordToCanonical(row));
  }

  async getResources(): Promise<Resource[]> {
    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - 56);

    const rows = await this.fetchData({
      mode: 'ssrs',
      resourceIds: [],
      startDate: start.toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10)
    });

    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.resourceId) {
        map.set(row.resourceId, row.resourceName || row.resourceId);
      }
    }

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }

  async getWorkItems(request: WorkloadRequest): Promise<CanonicalWorkItem[]> {
    return this.fetchData(request);
  }
}