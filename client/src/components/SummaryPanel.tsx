import { WorkloadResponse } from '../../../shared/types';

interface SummaryPanelProps {
  response: WorkloadResponse;
  startDate: string;
  endDate: string;
  selectedResourceCount: number;
}

export function SummaryPanel({ response, startDate, endDate, selectedResourceCount }: SummaryPanelProps): JSX.Element {
  return (
    <section className="panel summary-panel">
      <div className="section-heading">
        <div>
          <h2>Headline KPIs</h2>
          <p>Assumption: the default dashboard tracks weekly workload health for the selected date range.</p>
        </div>
      </div>
      <div className="summary-grid kpi-grid">
        <article>
          <h3>Date range</h3>
          <p>{startDate} to {endDate}</p>
        </article>
        <article>
          <h3>Resources in scope</h3>
          <p>{selectedResourceCount}</p>
        </article>
        <article>
          <h3>Total workload</h3>
          <p>{response.summary.total.toFixed(2)}</p>
        </article>
        <article>
          <h3>Average weekly workload</h3>
          <p>{response.summary.averageWeekly.toFixed(2)}</p>
        </article>
        <article>
          <h3>Peak week</h3>
          <p>{response.summary.peakWeek.weekLabel} ({response.summary.peakWeek.value.toFixed(2)})</p>
        </article>
        <article>
          <h3>Lowest week</h3>
          <p>{response.summary.lowWeek.weekLabel} ({response.summary.lowWeek.value.toFixed(2)})</p>
        </article>
      </div>
    </section>
  );
}
