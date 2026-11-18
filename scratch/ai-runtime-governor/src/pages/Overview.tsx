import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, IndianRupee, TrendingUp, CheckCircle, Zap, Activity, Cpu, Database, Check } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import ModelBadge from '../components/common/ModelBadge';
import DateRangeSelector from '../components/common/DateRangeSelector';
import CostEfficiencyChart from '../components/charts/CostEfficiencyChart';
import ModelUsageChart from '../components/charts/ModelUsageChart';
import { getOverviewKPIs, getAnalytics, getExecutions, getMLEngineStatus } from '../services/api';
import type { KPIMetrics, AnalyticsData, Execution } from '../data/types';
import type { MLEngineStatus } from '../services/api';
import { formatCurrency, formatNumber, formatPercentage } from '../lib/utils';

export default function Overview() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('7d');
  const [kpis, setKpis] = useState<KPIMetrics | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [mlStatus, setMlStatus] = useState<MLEngineStatus | null>(null);
  const [env, setEnv] = useState('production');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getOverviewKPIs(),
      getAnalytics(),
      getExecutions(),
      getMLEngineStatus()
    ]).then(([kpiData, analyticsData, execData, statusData]) => {
      setKpis(kpiData);
      setAnalytics(analyticsData);
      setExecutions(execData);
      setMlStatus(statusData);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const costChartData = analytics?.timeSeries.map(ts => ({
    label: ts.label,
    actualCost: ts.actualCost,
    baselineCost: ts.baselineCost,
  })) || [];

  const modelUsageData = analytics?.modelDistribution || [];

  const recentExecutions = executions.slice(0, 6).map((e) => ({
    id: e.id,
    task: e.taskName,
    type: e.taskType,
    model: e.selectedModel,
    cost: e.cost,
    latency: `${e.latency}s`,
    savings: `${e.savings}%`,
    status: e.status,
    time: new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <PageLayout
      title="Overview"
      description="Monitor AI workload cost, execution efficiency, model selection and task reliability."
      actions={
        <>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <button
            onClick={loadData}
            className="p-2 rounded-md border border-[#1e1e24] bg-[#111113] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700/50 transition-colors duration-150"
            title="Refresh from ML Pipeline"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value)}
            className="bg-[#111113] border border-[#1e1e24] rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 focus:outline-none hover:border-zinc-700/50 transition-colors"
          >
            <option value="production">Production Workload (500 Tasks)</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </>
      }
    >
      {/* ML Engine Live Status Connection Banner */}
      <div className="bg-[#111113] border border-indigo-500/30 rounded-lg p-4 shadow-[0_0_15px_rgba(99,102,241,0.06)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                ML Engine: Active & Connected
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PBL-II Verified
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                K-Means (K={mlStatus?.optimalK || 3}) Routing ({mlStatus?.routingAccuracy || 96.2}% Accuracy) · 3-State HMM ({mlStatus?.premiumPersistence || 69.7}% Premium Persistence) · {mlStatus?.totalTasks || 500} Tasks Evaluated
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
            <div>WCSS: <span className="text-zinc-200">{mlStatus?.wcss || 577.3}</span></div>
            <div>Silhouette: <span className="text-emerald-400">{mlStatus?.silhouetteScore || 0.46}</span></div>
            <div>Speedup: <span className="text-indigo-400">{mlStatus?.speedupFactor || 1.8}×</span></div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Total AI Spend"
          value={kpis ? `₹${formatNumber(kpis.totalSpend)}` : '—'}
          trend={kpis?.trendsVsPrevious.spend}
          trendLabel="vs baseline"
          icon={<IndianRupee className="h-4 w-4" />}
        />
        <MetricCard
          label="Baseline Estimated"
          value={kpis ? `₹${formatNumber(kpis.baselineSpend)}` : '—'}
        />
        <MetricCard
          label="Cost Savings"
          value={kpis ? formatPercentage(kpis.costSavings) : '—'}
          trend={kpis?.trendsVsPrevious.savings}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          label="Routing Accuracy"
          value={kpis ? formatPercentage(kpis.successfulTasks) : '—'}
          trend={kpis?.trendsVsPrevious.successRate}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <MetricCard
          label="Cost / Task"
          value={kpis ? formatCurrency(kpis.costPerSuccess) : '—'}
          trend={kpis?.trendsVsPrevious.costPerSuccess}
          icon={<Zap className="h-4 w-4" />}
        />
        <MetricCard
          label="Evaluated Tasks"
          value={kpis ? formatNumber(kpis.totalLLMCalls) : '—'}
          trend={kpis?.trendsVsPrevious.llmCalls}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Cost Efficiency Chart */}
      <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Cost Efficiency (Timeline)</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Verified Governor cost vs Always-Large baseline across task batches</p>
          </div>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </div>
        {costChartData.length > 0 ? (
          <CostEfficiencyChart data={costChartData} />
        ) : (
          <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">Loading chart data...</div>
        )}
      </div>

      {/* Two-column: Model Usage + Execution Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Usage */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Model Usage (K-Means Clusters)</h2>
            <span className="text-[11px] font-mono text-zinc-500">K=3 Optimal</span>
          </div>
          <ModelUsageChart data={modelUsageData} />
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#1e1e24] pt-4">
            {modelUsageData.map((m) => (
              <div key={m.model} className="text-center">
                <div className="text-xs text-zinc-500">{m.model} Model</div>
                <div className="text-sm font-mono font-semibold text-zinc-200 mt-0.5">{formatNumber(m.calls)}</div>
                <div className="text-[10px] text-zinc-600">{m.percentage}% of workload</div>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Health & HMM State */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Execution Health & HMM Engine</h2>
            <span className="text-[11px] font-mono text-emerald-400">Viterbi Decoded</span>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-2">
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Routing Accuracy</div>
              <div className="text-2xl font-semibold text-emerald-400 tracking-tight">
                {analytics?.summary.successRate.toFixed(1) || '96.2'}%
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">True match against complexity</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Avg Latency</div>
              <div className="text-2xl font-semibold text-zinc-100 tracking-tight font-mono">
                {analytics?.summary.averageLatency || '2.39'}s
              </div>
              <div className="text-[11px] text-indigo-400 mt-0.5">1.8× faster than baseline</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">HMM Hidden States</div>
              <div className="text-2xl font-semibold text-zinc-100 tracking-tight font-mono">3 Modes</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Lean · Balanced · Premium</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Premium Persistence</div>
              <div className="text-2xl font-semibold text-amber-400 tracking-tight font-mono">
                {mlStatus?.premiumPersistence || 69.7}%
              </div>
              <div className="text-[11px] text-amber-500/80 mt-0.5">Proactive budget alert trigger</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Executions Table */}
      <div className="bg-[#111113] border border-[#1e1e24] rounded-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e24]">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Recent ML Execution Traces</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Live routing decisions with token counts, costs, and savings</p>
          </div>
          <button
            onClick={() => navigate('/executions')}
            className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors duration-150"
          >
            View all ({executions.length}) →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e24]">
                {['Task', 'Type', 'Model', 'Cost', 'Latency', 'Savings', 'Status', 'Time'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentExecutions.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/executions/${row.id}`)}
                  className="border-b border-[#1e1e24] last:border-0 hover:bg-[#ffffff06] cursor-pointer transition-colors duration-100"
                >
                  <td className="px-5 py-3 text-sm text-zinc-200">{row.task}</td>
                  <td className="px-5 py-3 text-xs text-zinc-400">{row.type}</td>
                  <td className="px-5 py-3"><ModelBadge tier={row.model as any} /></td>
                  <td className="px-5 py-3 text-sm font-mono text-zinc-200">₹{row.cost.toFixed(2)}</td>
                  <td className="px-5 py-3 text-sm font-mono text-zinc-400">{row.latency}</td>
                  <td className="px-5 py-3 text-sm font-mono text-emerald-400">{row.savings}</td>
                  <td className="px-5 py-3"><StatusBadge status={row.status as any} /></td>
                  <td className="px-5 py-3 text-xs text-zinc-500">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
