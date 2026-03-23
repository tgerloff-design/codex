import mssql, { config as SqlConfig } from 'mssql';
import { CanonicalWorkItem, Resource, WorkloadRequest } from '../../../shared/types';
import { config } from '../config';
import { DataProvider } from './types';

const dbConfig: SqlConfig = {
  server: config.db.server,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  options: {
    encrypt: config.db.encrypt,
    trustServerCertificate: !config.db.encrypt
  }
};

function ensureDbEnv(): void {
  const required = ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing DB config: ${missing.join(', ')}`);
  }
}

export class DbProvider implements DataProvider {
  private pool: mssql.ConnectionPool | null = null;

  private async getPool(): Promise<mssql.ConnectionPool> {
    ensureDbEnv();
    if (this.pool && this.pool.connected) {
      return this.pool;
    }

    this.pool = await new mssql.ConnectionPool(dbConfig).connect();
    return this.pool;
  }

  async getResources(): Promise<Resource[]> {
    const pool = await this.getPool();

    // Adapt this query to your schema.
    const result = await pool.request().query(`
      SELECT DISTINCT
        CAST(resource_id AS NVARCHAR(100)) AS id,
        resource_name AS name
      FROM work_items
      WHERE resource_id IS NOT NULL
      ORDER BY resource_name;
    `);

    return result.recordset.map((row) => ({
      id: String(row.id),
      name: String(row.name)
    }));
  }

  async getWorkItems(request: WorkloadRequest): Promise<CanonicalWorkItem[]> {
    const pool = await this.getPool();

    const query = `
      SELECT
        CAST(w.resource_id AS NVARCHAR(100)) AS resourceId,
        w.resource_name AS resourceName,
        CONVERT(VARCHAR(10), w.work_date, 23) AS workDate,
        CAST(w.workload_hours AS FLOAT) AS workloadHours,
        CAST(w.workload_units AS FLOAT) AS workloadUnits
      FROM work_items w
      WHERE w.work_date >= @startDate
        AND w.work_date <= @endDate
        AND (
          @resourceCount = 0
          OR w.resource_id IN (SELECT value FROM STRING_SPLIT(@resourceIdsCsv, ','))
        )
      ORDER BY w.work_date ASC;
    `;

    const sqlRequest = pool.request();
    sqlRequest.input('startDate', mssql.Date, request.startDate);
    sqlRequest.input('endDate', mssql.Date, request.endDate);
    sqlRequest.input('resourceCount', mssql.Int, request.resourceIds.length);
    sqlRequest.input('resourceIdsCsv', mssql.NVarChar(mssql.MAX), request.resourceIds.join(','));

    const result = await sqlRequest.query(query);

    return result.recordset.map((row) => ({
      resourceId: String(row.resourceId),
      resourceName: String(row.resourceName),
      workDate: String(row.workDate),
      workloadHours: row.workloadHours == null ? undefined : Number(row.workloadHours),
      workloadUnits: row.workloadUnits == null ? undefined : Number(row.workloadUnits)
    }));
  }
}