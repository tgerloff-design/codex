import { CanonicalWorkItem, WeeklyPoint, WorkloadResponse } from '../../../shared/types';

interface AggregateOptions {
  startDate: string;
  endDate: string;
  selectedResourceIds: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDate(dateInput: string): Date {
  return new Date(`${dateInput}T00:00:00Z`);
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getWeekStart(date: Date): Date {
  const day = date.getUTCDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(date);
  weekStart.setUTCDate(weekStart.getUTCDate() + distanceToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

function getIsoWeekParts(date: Date): { year: number; week: number } {
  const target = new Date(date);
  target.setUTCHours(0, 0, 0, 0);

  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / DAY_MS) + 1) / 7);

  return { year: target.getUTCFullYear(), week };
}

function buildWeekLabel(weekStart: Date): string {
  const { year, week } = getIsoWeekParts(weekStart);
  const month = weekStart.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = weekStart.getUTCDate();
  return `${year}-W${String(week).padStart(2, '0')} (${month} ${day})`;
}

function getWorkloadValue(item: CanonicalWorkItem): number {
  if (typeof item.workloadHours === 'number') {
    return item.workloadHours;
  }

  if (typeof item.workloadUnits === 'number') {
    return item.workloadUnits;
  }

  return 0;
}

export function aggregateWeekly(rows: CanonicalWorkItem[], options: AggregateOptions): WorkloadResponse {
  const start = toUtcDate(options.startDate);
  const end = toUtcDate(options.endDate);

  const filteredRows = rows.filter((row) => {
    const rowDate = toUtcDate(row.workDate.slice(0, 10));
    const inRange = rowDate >= start && rowDate <= end;

    if (!inRange) {
      return false;
    }

    if (options.selectedResourceIds.length === 0) {
      return true;
    }

    return options.selectedResourceIds.includes(row.resourceId);
  });

  const weekBuckets = new Map<string, WeeklyPoint>();

  for (let dateCursor = getWeekStart(start); dateCursor <= end; dateCursor = new Date(dateCursor.getTime() + 7 * DAY_MS)) {
    const weekStart = new Date(dateCursor);
    const weekEnd = new Date(Math.min(weekStart.getTime() + 6 * DAY_MS, end.getTime()));
    const key = formatIsoDate(weekStart);

    weekBuckets.set(key, {
      weekStart: key,
      weekEnd: formatIsoDate(weekEnd),
      weekLabel: buildWeekLabel(weekStart),
      total: 0,
      byResource: {}
    });
  }

  for (const row of filteredRows) {
    const rowDate = toUtcDate(row.workDate.slice(0, 10));
    const weekStart = getWeekStart(rowDate);
    const weekKey = formatIsoDate(weekStart);
    const bucket = weekBuckets.get(weekKey);

    if (!bucket) {
      continue;
    }

    const value = getWorkloadValue(row);
    bucket.total += value;
    bucket.byResource[row.resourceId] = (bucket.byResource[row.resourceId] ?? 0) + value;
  }

  const weeks = Array.from(weekBuckets.values());
  const total = Number(weeks.reduce((sum, week) => sum + week.total, 0).toFixed(2));
  const averageWeekly = weeks.length === 0 ? 0 : Number((total / weeks.length).toFixed(2));

  const defaultWeek = { weekLabel: 'N/A', value: 0 };
  let peakWeek = defaultWeek;
  let lowWeek = defaultWeek;

  if (weeks.length > 0) {
    const sortedByTotal = [...weeks].sort((a, b) => a.total - b.total);
    lowWeek = { weekLabel: sortedByTotal[0].weekLabel, value: Number(sortedByTotal[0].total.toFixed(2)) };
    const last = sortedByTotal[sortedByTotal.length - 1];
    peakWeek = { weekLabel: last.weekLabel, value: Number(last.total.toFixed(2)) };
  }

  return {
    weeks: weeks.map((week) => ({
      ...week,
      total: Number(week.total.toFixed(2)),
      byResource: Object.fromEntries(
        Object.entries(week.byResource).map(([resourceId, value]) => [resourceId, Number(value.toFixed(2))])
      )
    })),
    summary: {
      total,
      averageWeekly,
      peakWeek,
      lowWeek
    }
  };
}