import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Resource, WeeklyPoint } from '../../../shared/types';

interface WorkloadChartProps {
  weeks: WeeklyPoint[];
  resources: Resource[];
  mode: 'total' | 'byResource';
  averageWeekly: number;
}

const COLORS = ['#1565c0', '#2e7d32', '#ef6c00', '#6a1b9a', '#ad1457', '#00838f', '#455a64'];

export function WorkloadChart({ weeks, resources, mode, averageWeekly }: WorkloadChartProps): JSX.Element {
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  const data = useMemo(() => {
    return weeks.map((week) => {
      const point: Record<string, string | number> = {
        weekLabel: week.weekLabel,
        total: week.total
      };

      for (const resource of resources) {
        point[resource.id] = week.byResource[resource.id] ?? 0;
      }

      return point;
    });
  }, [weeks, resources]);

  const handleLegendClick = (entry: { dataKey?: string | number }): void => {
    const key = String(entry.dataKey ?? '');
    if (!key || key === 'total') {
      return;
    }

    setHiddenSeries((previous) => ({
      ...previous,
      [key]: !previous[key]
    }));
  };

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={380}>
        {mode === 'total' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekLabel" interval={0} angle={-20} textAnchor="end" height={75} />
            <YAxis />
            <Tooltip />
            <Legend />
            <ReferenceLine y={averageWeekly} stroke="#d32f2f" strokeDasharray="4 4" label="Average" />
            <Bar dataKey="total" name="Total workload" fill="#1565c0" />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekLabel" interval={0} angle={-20} textAnchor="end" height={75} />
            <YAxis />
            <Tooltip />
            <Legend onClick={handleLegendClick} />
            <ReferenceLine y={averageWeekly} stroke="#d32f2f" strokeDasharray="4 4" label="Average" />
            {resources.map((resource, index) => (
              <Line
                key={resource.id}
                type="monotone"
                dataKey={resource.id}
                name={resource.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                hide={Boolean(hiddenSeries[resource.id])}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
