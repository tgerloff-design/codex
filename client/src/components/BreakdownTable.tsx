import { useMemo } from 'react';
import { Resource, WorkloadResponse } from '../../../shared/types';

interface BreakdownTableProps {
  response: WorkloadResponse;
  resources: Resource[];
}

interface ResourceRow {
  id: string;
  name: string;
  total: number;
  averageWeekly: number;
  peakWeekLabel: string;
  peakWeekValue: number;
}

export function BreakdownTable({ response, resources }: BreakdownTableProps): JSX.Element {
  const rows = useMemo<ResourceRow[]>(() => {
    return resources
      .map((resource) => {
        const weeklyValues = response.weeks.map((week) => ({
          weekLabel: week.weekLabel,
          value: week.byResource[resource.id] ?? 0
        }));

        const total = weeklyValues.reduce((sum, week) => sum + week.value, 0);
        const peakWeek = weeklyValues.reduce(
          (current, week) => (week.value > current.value ? week : current),
          weeklyValues[0] ?? { weekLabel: 'N/A', value: 0 }
        );

        return {
          id: resource.id,
          name: resource.name,
          total,
          averageWeekly: response.weeks.length > 0 ? total / response.weeks.length : 0,
          peakWeekLabel: peakWeek.weekLabel,
          peakWeekValue: peakWeek.value
        };
      })
      .sort((left, right) => right.total - left.total);
  }, [response, resources]);

  return (
    <section className="panel table-panel">
      <div className="section-heading">
        <div>
          <h2>Breakdown Table</h2>
          <p>Per-resource rollup from the current workload response. Replace or extend these columns when business metrics are defined.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="breakdown-table">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Total workload</th>
              <th>Avg / week</th>
              <th>Peak week</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.total.toFixed(2)}</td>
                <td>{row.averageWeekly.toFixed(2)}</td>
                <td>{row.peakWeekLabel} ({row.peakWeekValue.toFixed(2)})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
