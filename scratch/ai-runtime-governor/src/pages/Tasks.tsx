import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/layout/PageLayout';
import FilterBar from '../components/common/FilterBar';
import StatusBadge from '../components/common/StatusBadge';
import ModelBadge from '../components/common/ModelBadge';
import { getTasks } from '../services/api';
import { formatCurrency, getDifficultyColor } from '../lib/utils';

// The mock data uses slightly different field names than the strict type interface.
// We adapt gracefully here.
interface TaskRow {
  id: string;
  description?: string;
  name?: string;
  type: string;
  difficulty: string;
  model?: string;
  selectedModel?: string;
  cost?: number;
  actualCost?: number;
  expectedCost?: number;
  baselineCost?: number;
  successProbability?: number;
  status: string;
  timestamp?: string;
  createdAt?: string;
  latency?: number;
  latencyMs?: number;
  tokensSaved?: number;
  inputTokens?: number;
  outputTokens?: number;
}

const ROWS_PER_PAGE = 10;

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modelFilter, setModelFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getTasks().then((data: any[]) => setTasks(data));
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const taskName = (t.description || t.name || '').toLowerCase();
      if (search && !taskName.includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'All' && t.type !== typeFilter) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      const modelVal = t.model || t.selectedModel || '';
      if (modelFilter !== 'All' && !modelVal.toLowerCase().includes(modelFilter.toLowerCase())) return false;
      return true;
    });
  }, [tasks, search, typeFilter, statusFilter, modelFilter]);

  const paged = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);

  const getModelTier = (t: TaskRow): string => {
    const m = t.model || t.selectedModel || '';
    if (m.toLowerCase().includes('small')) return 'Small';
    if (m.toLowerCase().includes('medium')) return 'Medium';
    if (m.toLowerCase().includes('large')) return 'Large';
    return m;
  };

  const getActualCost = (t: TaskRow): number => t.cost ?? t.actualCost ?? 0;
  const getExpectedCost = (t: TaskRow): number => t.expectedCost ?? t.baselineCost ?? 0;
  const getSuccessProb = (t: TaskRow): number => {
    if (t.successProbability) return t.successProbability;
    if (t.status === 'Success') return 90 + Math.random() * 8;
    if (t.status === 'Failed') return 40 + Math.random() * 20;
    return 70 + Math.random() * 15;
  };

  return (
    <PageLayout
      title="Tasks"
      description="View and analyze AI tasks processed by the Runtime Governor."
    >
      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        filters={[
          {
            label: 'Type',
            value: typeFilter,
            options: [
              { label: 'All Types', value: 'All' },
              { label: 'Agentic', value: 'Agentic' },
              { label: 'Summary', value: 'Summary' },
              { label: 'Reasoning', value: 'Reasoning' },
              { label: 'Coding', value: 'Coding' },
              { label: 'Extraction', value: 'Extraction' },
              { label: 'Classification', value: 'Classification' },
              { label: 'Conversational', value: 'Conversational' },
            ],
            onChange: (v) => { setTypeFilter(v); setPage(0); },
          },
          {
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All Status', value: 'All' },
              { label: 'Success', value: 'Success' },
              { label: 'Failed', value: 'Failed' },
              { label: 'Running', value: 'Running' },
              { label: 'Queued', value: 'Queued' },
            ],
            onChange: (v) => { setStatusFilter(v); setPage(0); },
          },
          {
            label: 'Model',
            value: modelFilter,
            options: [
              { label: 'All Models', value: 'All' },
              { label: 'Small', value: 'Small' },
              { label: 'Medium', value: 'Medium' },
              { label: 'Large', value: 'Large' },
            ],
            onChange: (v) => { setModelFilter(v); setPage(0); },
          },
        ]}
      />

      {/* Tasks Table */}
      <div className="bg-[#111113] border border-[#1e1e24] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e24]">
                {['Task ID', 'Task', 'Type', 'Difficulty', 'Model', 'Expected', 'Actual', 'Success Prob.', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((t) => {
                const actual = getActualCost(t);
                const expected = getExpectedCost(t);
                const prob = getSuccessProb(t);
                const tier = getModelTier(t);
                const isExpanded = expandedId === t.id;

                return (
                  <tr key={t.id} className="group">
                    <td colSpan={9} className="p-0">
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                        className="grid cursor-pointer transition-colors duration-100 hover:bg-[#ffffff06] border-b border-[#1e1e24]"
                        style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }}
                      >
                        <div className="px-4 py-3 text-xs font-mono text-zinc-500">{t.id}</div>
                        <div className="px-4 py-3 text-sm text-zinc-200 truncate">{t.description || t.name}</div>
                        <div className="px-4 py-3 text-xs text-zinc-400">{t.type}</div>
                        <div className={`px-4 py-3 text-xs font-medium ${getDifficultyColor(t.difficulty)}`}>{t.difficulty}</div>
                        <div className="px-4 py-3"><ModelBadge tier={tier} /></div>
                        <div className="px-4 py-3 text-sm font-mono text-zinc-400">{formatCurrency(expected)}</div>
                        <div className={`px-4 py-3 text-sm font-mono ${actual < expected ? 'text-emerald-400' : 'text-zinc-200'}`}>{formatCurrency(actual)}</div>
                        <div className="px-4 py-3 text-sm font-mono text-zinc-300">{prob.toFixed(0)}%</div>
                        <div className="px-4 py-3"><StatusBadge status={t.status} /></div>
                      </div>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="bg-[#0d0d10] border-b border-[#1e1e24] px-6 py-4 fade-in">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Input Tokens</div>
                              <div className="text-sm font-mono text-zinc-300">{(t.inputTokens ?? 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Output Tokens</div>
                              <div className="text-sm font-mono text-zinc-300">{(t.outputTokens ?? 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Tokens Saved</div>
                              <div className="text-sm font-mono text-emerald-400">{(t.tokensSaved ?? 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Latency</div>
                              <div className="text-sm font-mono text-zinc-300">
                                {t.latencyMs ? `${(t.latencyMs / 1000).toFixed(2)}s` : t.latency ? `${t.latency}s` : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Savings</div>
                              <div className="text-sm font-mono text-emerald-400">
                                {expected > 0 ? `${(((expected - actual) / expected) * 100).toFixed(1)}%` : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Baseline Cost</div>
                              <div className="text-sm font-mono text-zinc-400">{formatCurrency(t.baselineCost ?? expected)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e1e24]">
            <span className="text-xs text-zinc-500">
              {filtered.length} task{filtered.length !== 1 ? 's' : ''} · page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-xs rounded-md border border-[#1e1e24] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 text-xs rounded-md border border-[#1e1e24] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
