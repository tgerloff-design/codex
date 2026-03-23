import { describe, expect, test } from 'vitest';
import { aggregateWeekly } from '../src/utils/aggregation';
import { CanonicalWorkItem } from '../../shared/types';

describe('aggregateWeekly', () => {
  test('aggregates totals by ISO week and computes summary', () => {
    const rows: CanonicalWorkItem[] = [
      { resourceId: 'u1', resourceName: 'Ava', workDate: '2026-02-09', workloadHours: 8 },
      { resourceId: 'u2', resourceName: 'Noah', workDate: '2026-02-10', workloadHours: 6 },
      { resourceId: 'u1', resourceName: 'Ava', workDate: '2026-02-17', workloadHours: 7 }
    ];

    const result = aggregateWeekly(rows, {
      startDate: '2026-02-09',
      endDate: '2026-02-22',
      selectedResourceIds: []
    });

    expect(result.weeks).toHaveLength(2);
    expect(result.weeks[0].total).toBe(14);
    expect(result.weeks[1].total).toBe(7);
    expect(result.summary.total).toBe(21);
    expect(result.summary.averageWeekly).toBe(10.5);
    expect(result.summary.peakWeek.value).toBe(14);
    expect(result.summary.lowWeek.value).toBe(7);
  });

  test('filters by selected resources and includes empty weeks', () => {
    const rows: CanonicalWorkItem[] = [
      { resourceId: 'u1', resourceName: 'Ava', workDate: '2026-03-02', workloadUnits: 4 },
      { resourceId: 'u2', resourceName: 'Noah', workDate: '2026-03-03', workloadUnits: 10 },
      { resourceId: 'u1', resourceName: 'Ava', workDate: '2026-03-17', workloadUnits: 6 }
    ];

    const result = aggregateWeekly(rows, {
      startDate: '2026-03-02',
      endDate: '2026-03-22',
      selectedResourceIds: ['u1']
    });

    expect(result.weeks).toHaveLength(3);
    expect(result.weeks[0].total).toBe(4);
    expect(result.weeks[1].total).toBe(0);
    expect(result.weeks[2].total).toBe(6);
    expect(result.weeks[0].byResource.u1).toBe(4);
    expect(result.weeks[0].byResource.u2).toBeUndefined();
    expect(result.summary.total).toBe(10);
  });
});