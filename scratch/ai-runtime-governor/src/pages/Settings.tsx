import { useState } from 'react';
import { Save, RotateCw } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

interface SettingRow {
  id: string;
  label: string;
  description: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'toggle' | 'select';
  options?: string[];
}

const defaultSettings: SettingRow[] = [
  {
    id: 'governor_mode',
    label: 'Governor Mode',
    description: 'Controls how the AI Runtime Governor selects models for each task.',
    type: 'select',
    value: 'auto',
    options: ['auto', 'cost_optimized', 'quality_optimized', 'manual'],
  },
  {
    id: 'default_model',
    label: 'Default Fallback Model',
    description: 'Model to use when the governor cannot determine a confident selection.',
    type: 'select',
    value: 'Medium',
    options: ['Small', 'Medium', 'Large'],
  },
  {
    id: 'max_retries',
    label: 'Maximum Retries',
    description: 'Global limit on retries per task across all policies.',
    type: 'number',
    value: 3,
  },
  {
    id: 'enable_tracing',
    label: 'Enable Execution Tracing',
    description: 'Record full execution traces for every task. Increases storage usage.',
    type: 'toggle',
    value: true,
  },
  {
    id: 'enable_cost_alerts',
    label: 'Cost Anomaly Alerts',
    description: 'Notify when a task cost exceeds 2× its predicted baseline.',
    type: 'toggle',
    value: true,
  },
  {
    id: 'enable_quality_verification',
    label: 'Quality Verification',
    description: 'Run automatic quality checks on LLM outputs before returning results.',
    type: 'toggle',
    value: true,
  },
  {
    id: 'context_compression',
    label: 'Context Compression',
    description: 'Automatically compress large prompts to reduce token usage.',
    type: 'toggle',
    value: true,
  },
  {
    id: 'api_timeout',
    label: 'API Timeout (seconds)',
    description: 'Maximum wait time for LLM API responses before aborting.',
    type: 'number',
    value: 30,
  },
  {
    id: 'environment',
    label: 'Environment',
    description: 'Active deployment environment for this governor instance.',
    type: 'select',
    value: 'production',
    options: ['development', 'staging', 'production'],
  },
];

export default function Settings() {
  const [settings, setSettings] = useState<SettingRow[]>(defaultSettings);
  const [saved, setSaved] = useState(false);

  const update = (id: string, newVal: string | number | boolean) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, value: newVal } : s));
    setSaved(false);
  };

  const handleSave = () => {
    // In production this would persist to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleSettings = settings.filter(s => s.type === 'toggle');
  const otherSettings = settings.filter(s => s.type !== 'toggle');

  return (
    <PageLayout
      title="Settings"
      description="Configure the AI Runtime Governor behaviour, defaults, and environment."
      actions={
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-2 rounded-md transition-colors"
        >
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      }
    >
      <div className="space-y-6 max-w-3xl">

        {/* Configuration settings */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg">
          <div className="px-5 py-4 border-b border-[#1e1e24]">
            <h2 className="text-sm font-semibold text-zinc-200">Governor Configuration</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Core settings that control model routing and task execution behaviour.</p>
          </div>
          <div className="divide-y divide-[#1e1e24]">
            {otherSettings.map(setting => (
              <div key={setting.id} className="px-5 py-4 flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200">{setting.label}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{setting.description}</div>
                </div>
                <div className="shrink-0">
                  {setting.type === 'select' && (
                    <select
                      value={String(setting.value)}
                      onChange={e => update(setting.id, e.target.value)}
                      className="bg-[#0d0d10] border border-[#2a2a35] rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-colors min-w-[140px]"
                    >
                      {setting.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {setting.type === 'number' && (
                    <input
                      type="number"
                      value={Number(setting.value)}
                      onChange={e => update(setting.id, Number(e.target.value))}
                      className="bg-[#0d0d10] border border-[#2a2a35] rounded-md px-3 py-1.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-colors w-24 text-right"
                    />
                  )}
                  {setting.type === 'text' && (
                    <input
                      type="text"
                      value={String(setting.value)}
                      onChange={e => update(setting.id, e.target.value)}
                      className="bg-[#0d0d10] border border-[#2a2a35] rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-colors w-48"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle settings */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg">
          <div className="px-5 py-4 border-b border-[#1e1e24]">
            <h2 className="text-sm font-semibold text-zinc-200">Feature Flags</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Enable or disable individual governor capabilities.</p>
          </div>
          <div className="divide-y divide-[#1e1e24]">
            {toggleSettings.map(setting => (
              <div key={setting.id} className="px-5 py-4 flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200">{setting.label}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{setting.description}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(setting.value)}
                  onClick={() => update(setting.id, !setting.value)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 focus:outline-none ${
                    setting.value ? 'bg-indigo-500' : 'bg-zinc-700'
                  }`}
                >
                  <span className="sr-only">Toggle {setting.label}</span>
                  <span
                    className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-150 ease-in-out ${
                      setting.value ? 'translate-x-2' : '-translate-x-2'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-[#111113] border border-red-500/20 rounded-lg">
          <div className="px-5 py-4 border-b border-red-500/20">
            <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Irreversible actions. Proceed with caution.</p>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-zinc-200">Reset to Defaults</div>
              <div className="text-xs text-zinc-500 mt-0.5">Reset all governor settings to factory defaults.</div>
            </div>
            <button
              onClick={() => { setSettings(defaultSettings); setSaved(false); }}
              className="flex items-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs px-3 py-1.5 rounded-md transition-colors"
            >
              <RotateCw size={13} />
              Reset
            </button>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
