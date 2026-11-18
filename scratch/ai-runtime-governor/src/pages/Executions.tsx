import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import FilterBar from '../components/common/FilterBar';
import StatusBadge from '../components/common/StatusBadge';
import ModelBadge from '../components/common/ModelBadge';
import DateRangeSelector from '../components/common/DateRangeSelector';
import { getExecutions } from '../services/api';
import type { Execution } from '../data/types';
import { formatCurrency } from '../lib/utils';

const ROWS_PER_PAGE = 10;

// Helper to extract display values from execution data
function getExecDisplayValues(exec: any) {
  const taskName = exec.taskName || exec.description || `Task ${exec.taskId || exec.id}`;
  const taskDesc = exec.taskDescription || '';
  const model = exec.selectedModel || exec.model || 'Medium';
  const cost = exec.cost ?? exec.actualCost ?? 0;
  const baseline = exec.baselineCost ?? 0;
  const savings = exec.savings ?? (baseline > 0 ? ((baseline - cost) / baseline) * 100 : 0);
  const latency = exec.latency ?? (exec.latencyMs ? exec.latencyMs / 1000 : 0);
  const status = exec.status || 'Success';

  const modelTier = (() => {
    if (typeof model === 'string') {
      if (model.toLowerCase().includes('small')) return 'Small';
      if (model.toLowerCase().includes('large')) return 'Large';
      return 'Medium';
    }
    return model;
  })();

  return { taskName, taskDesc, modelTier, cost, baseline, savings, latency, status };
}

export default function Executions() {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modelFilter, setModelFilter] = useState('All');
  const [dateRange, setDateRange] = useState('7d');
  const [page, setPage] = useState(0);

  useEffect(() => {
    getExecutions().then(setExecutions);
  }, []);

  const filtered = useMemo(() => {
    return executions.filter((e) => {
      const { taskName, modelTier, status } = getExecDisplayValues(e);
      if (search && !taskName.toLowerCase().includes(search.toLowerCase()) && !(e.id || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'All' && status !== statusFilter) return false;
      if (modelFilter !== 'All' && modelTier !== modelFilter) return false;
      return true;
    });
  }, [executions, search, statusFilter, modelFilter]);

  const paged = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);

  return (
    <PageLayout
      title="Executions"
      description="Inspect AI execution traces, model decisions, and cost optimization details."
      actions={<DateRangeSelector value={dateRange} onChange={setDateRange} />}
    >
      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All Status', value: 'All' },
              { label: 'Success', value: 'Success' },
              { label: 'Failed', value: 'Failed' },
              { label: 'Running', value: 'Running' },
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

      {/* Execution Cards List */}
      <div className="space-y-2">
        {paged.map((exec) => {
          const { taskName, taskDesc, modelTier, cost, savings, latency, status } = getExecDisplayValues(exec);
          return (
            <div
              key={exec.id}
              onClick={() => navigate(`/executions/${exec.id}`)}
              className="bg-[#111113] border border-[#1e1e24] rounded-lg p-4 cursor-pointer hover:bg-[#ffffff06] hover:border-[#2a2a35]/70 transition-colors duration-100"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-zinc-600">{exec.id}</span>
                    <StatusBadge status={status} />
                    <ModelBadge tier={modelTier} />
                  </div>
                  <h3 className="text-sm font-medium text-zinc-200 truncate">{taskName}</h3>
                  {taskDesc && <p className="text-xs text-zinc-500 mt-0.5 truncate">{taskDesc}</p>}
                </div>

                {/* Right: Stats */}
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Cost</div>
                    <div className="text-sm font-mono text-zinc-200">{formatCurrency(cost)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Savings</div>
                    <div className="text-sm font-mono text-emerald-400">{savings.toFixed(1)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Latency</div>
                    <div className="text-sm font-mono text-zinc-400">{latency.toFixed(2)}s</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {paged.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">No executions found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {filtered.length} execution{filtered.length !== 1 ? 's' : ''} · page {page + 1} of {totalPages}
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
    </PageLayout>
  );
}
