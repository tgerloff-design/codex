import { Mode, Resource } from '../../../shared/types';

interface FormState {
  mode: Mode;
  startDate: string;
  endDate: string;
  resourceIds: string[];
}

interface FilterPanelProps {
  form: FormState;
  resources: Resource[];
  loadingResources: boolean;
  onChange: (state: FormState) => void;
  onApply: () => void;
  onReset: () => void;
}

export function FilterPanel(props: FilterPanelProps): JSX.Element {
  const { form, resources, loadingResources, onChange, onApply, onReset } = props;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    onChange({
      ...form,
      [key]: value
    });
  }

  return (
    <section className="panel filters">
      <div className="filter-grid">
        <label>
          Mode
          <select value={form.mode} onChange={(event) => updateField('mode', event.target.value as Mode)}>
            <option value="db">Database</option>
            <option value="ssrs">SSRS</option>
          </select>
        </label>

        <label>
          Start date
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => updateField('startDate', event.target.value)}
          />
        </label>

        <label>
          End date
          <input
            type="date"
            value={form.endDate}
            onChange={(event) => updateField('endDate', event.target.value)}
          />
        </label>

        <label className="resources-select">
          Resources
          <select
            multiple
            value={form.resourceIds}
            onChange={(event) => {
              const options = Array.from(event.target.selectedOptions).map((option) => option.value);
              updateField('resourceIds', options);
            }}
          >
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </select>
          <small>{loadingResources ? 'Loading resources...' : 'Leave empty to include all resources.'}</small>
        </label>
      </div>

      <div className="actions">
        <button type="button" onClick={onApply}>Apply</button>
        <button type="button" className="secondary" onClick={onReset}>Reset</button>
      </div>
    </section>
  );
}