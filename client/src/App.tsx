import { useEffect, useMemo, useState } from 'react';
import { fetchResources, fetchWorkload } from './api/client';
import { Mode, Resource, WorkloadRequest, WorkloadResponse } from '../../shared/types';
import { getDefaultDateRange } from './utils/date';
import { FilterPanel } from './components/FilterPanel';
import { WorkloadChart } from './components/WorkloadChart';
import { SummaryPanel } from './components/SummaryPanel';
import { BreakdownTable } from './components/BreakdownTable';

const defaults = getDefaultDateRange();

interface FormState {
  mode: Mode;
  startDate: string;
  endDate: string;
  resourceIds: string[];
}

const initialForm: FormState = {
  mode: 'db',
  startDate: defaults.startDate,
  endDate: defaults.endDate,
  resourceIds: []
};

export default function App(): JSX.Element {
  const [form, setForm] = useState<FormState>(initialForm);
  const [resources, setResources] = useState<Resource[]>([]);
  const [data, setData] = useState<WorkloadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'total' | 'byResource'>('total');

  const selectedResources = useMemo(() => {
    if (form.resourceIds.length === 0) {
      return resources;
    }

    const ids = new Set(form.resourceIds);
    return resources.filter((resource) => ids.has(resource.id));
  }, [resources, form.resourceIds]);

  async function loadResources(mode: Mode): Promise<void> {
    setResourceLoading(true);
    setError(null);

    try {
      const result = await fetchResources(mode);
      setResources(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load resources');
      setResources([]);
    } finally {
      setResourceLoading(false);
    }
  }

  async function loadWorkload(state: FormState): Promise<void> {
    setLoading(true);
    setError(null);

    const payload: WorkloadRequest = {
      mode: state.mode,
      resourceIds: state.resourceIds,
      startDate: state.startDate,
      endDate: state.endDate
    };

    try {
      const result = await fetchWorkload(payload);
      setData(result);
    } catch (err) {
      const details = import.meta.env.DEV && err instanceof Error ? ` ${err.message}` : '';
      setError(`Unable to load workload data.${details}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResources(form.mode);
  }, [form.mode]);

  useEffect(() => {
    void loadWorkload(initialForm);
  }, []);

  function handleApply(): void {
    void loadWorkload(form);
  }

  function handleReset(): void {
    setForm(initialForm);
    setChartMode('total');
    void loadResources(initialForm.mode);
    void loadWorkload(initialForm);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Workload Dashboard</h1>
        <p>Dashboard shell assumption: monitor weekly workload by resource using the repo's existing workload endpoint and filters.</p>
      </header>

      <FilterPanel
        form={form}
        resources={resources}
        loadingResources={resourceLoading}
        onChange={setForm}
        onApply={handleApply}
        onReset={handleReset}
      />

      {loading ? <div className="status loading">Loading workload...</div> : null}
      {!loading && error ? <div className="status error">{error}</div> : null}
      {!loading && !error && data && data.weeks.length === 0 ? (
        <div className="status empty">No data for selected filters.</div>
      ) : null}

      {!loading && !error && data && data.weeks.length > 0 ? (
        <>
          <SummaryPanel
            response={data}
            startDate={form.startDate}
            endDate={form.endDate}
            selectedResourceCount={selectedResources.length}
          />
          <section className="panel chart-panel">
            <div className="section-heading">
              <div>
                <h2>Trends</h2>
                <p>Switch between the aggregate view and the by-resource trend to compare movement over time.</p>
              </div>
            </div>
            <section className="view-toggle" aria-label="Chart mode toggle">
              <button
                className={chartMode === 'total' ? 'toggle-btn active' : 'toggle-btn'}
                onClick={() => setChartMode('total')}
                type="button"
              >
                Total only
              </button>
              <button
                className={chartMode === 'byResource' ? 'toggle-btn active' : 'toggle-btn'}
                onClick={() => setChartMode('byResource')}
                type="button"
              >
                By resource
              </button>
            </section>
            <WorkloadChart
              weeks={data.weeks}
              resources={selectedResources}
              mode={chartMode}
              averageWeekly={data.summary.averageWeekly}
            />
          </section>
          <BreakdownTable response={data} resources={selectedResources} />
        </>
      ) : null}
    </div>
  );
}
