import { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import MetricCard from '../components/common/MetricCard';
import DateRangeSelector from '../components/common/DateRangeSelector';
import CostEfficiencyChart from '../components/charts/CostEfficiencyChart';
import ModelUsageChart from '../components/charts/ModelUsageChart';
import ComparisonChart from '../components/charts/ComparisonChart';
import { getAnalytics } from '../services/api';
import type { AnalyticsData, StrategyComparison } from '../data/types';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState<keyof StrategyComparison | 'costPerSuccess'>('totalCost');

  useEffect(() => {
    getAnalytics().then(setAnalytics);
  }, []);

  if (!analytics) {
    return (
      <PageLayout title="Analytics" description="Comprehensive cost, performance, and efficiency analytics across all AI workloads.">
        <div className="flex items-center justify-center h-64 text-zinc-500">Loading analytics data...</div>
      </PageLayout>
    );
  }

  const costEfficiencyData = analytics.timeSeries.map(ts => ({
    label: ts.label,
    actualCost: ts.actualCost,
    baselineCost: ts.baselineCost,
  }));

  const formatCurrency = (val: number) => `₹${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const metricOptions = [
    { id: 'totalCost', label: 'Total Cost' },
    { id: 'successRate', label: 'Success Rate' },
    { id: 'averageQuality', label: 'Avg Quality' },
    { id: 'averageLatency', label: 'Latency' },
    { id: 'costPerSuccess', label: 'Cost / Success' }
  ];

  return (
    <PageLayout 
      title="Analytics" 
      description="Comprehensive cost, performance, and efficiency analytics across all AI workloads."
      actions={<DateRangeSelector value={dateRange} onChange={setDateRange} />}
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            label="Total Cost" 
            value={formatCurrency(analytics.summary.totalCost)} 
            trend={-12.5} 
            trendLabel="vs last period" 
          />
          <MetricCard 
            label="Total LLM Calls" 
            value={analytics.summary.totalCalls.toLocaleString()} 
            trend={5.2} 
            trendLabel="vs last period" 
          />
          <MetricCard 
            label="Success Rate" 
            value={`${analytics.summary.successRate.toFixed(1)}%`} 
            trend={2.1} 
            trendLabel="vs last period" 
          />
          <MetricCard 
            label="Avg Latency" 
            value={`${analytics.summary.averageLatency}s`} 
            trend={-8.4} 
            trendLabel="vs last period" 
          />
        </div>

        {/* Comparison Section (Hero) */}
        <div className="bg-[#111113] border border-indigo-500/20 rounded-lg p-6 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-zinc-100">Strategy Comparison — Baseline vs Governor</h3>
            <p className="text-sm text-zinc-400 mt-1">Comparing the AI Runtime Governor against fixed-model and simple routing strategies.</p>
          </div>
          
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 border-b border-[#1e1e24]">
                <tr>
                  <th className="px-4 py-3 font-medium">Strategy</th>
                  <th className="px-4 py-3 font-medium text-right">Total Cost</th>
                  <th className="px-4 py-3 font-medium text-right">Success Rate</th>
                  <th className="px-4 py-3 font-medium text-right">Avg Quality</th>
                  <th className="px-4 py-3 font-medium text-right">Avg Latency</th>
                  <th className="px-4 py-3 font-medium text-right">Cost / Success</th>
                </tr>
              </thead>
              <tbody>
                {analytics.strategyComparison.map((strat, i) => {
                  const isGov = strat.strategy === 'AI Runtime Governor';
                  const isBestCost = Math.min(...analytics.strategyComparison.map(s => s.totalCost)) === strat.totalCost;
                  const isBestSuccess = Math.max(...analytics.strategyComparison.map(s => s.successRate)) === strat.successRate;
                  const isBestQuality = Math.max(...analytics.strategyComparison.map(s => s.averageQuality)) === strat.averageQuality;
                  const isBestCostPerSuccess = Math.min(...analytics.strategyComparison.map(s => s.costPerSuccess)) === strat.costPerSuccess;

                  return (
                    <tr key={i} className={`border-b border-[#1e1e24]/50 ${isGov ? 'bg-indigo-500/5' : ''}`}>
                      <td className="px-4 py-3 font-medium text-zinc-200">
                        {strat.strategy}
                        {isGov && <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">Active</span>}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${isBestCost ? 'text-emerald-400' : 'text-zinc-300'}`}>
                        {formatCurrency(strat.totalCost)}
                      </td>
                      <td className={`px-4 py-3 text-right ${isBestSuccess ? 'text-emerald-400' : 'text-zinc-300'}`}>
                        {strat.successRate.toFixed(1)}%
                      </td>
                      <td className={`px-4 py-3 text-right ${isBestQuality ? 'text-emerald-400' : 'text-zinc-300'}`}>
                        {strat.averageQuality}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-300">
                        {strat.averageLatency}s
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${isBestCostPerSuccess ? 'text-emerald-400' : 'text-zinc-300'}`}>
                        {formatCurrency(strat.costPerSuccess)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {metricOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelectedMetric(opt.id as keyof StrategyComparison)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedMetric === opt.id 
                    ? 'bg-zinc-800 text-zinc-100' 
                    : 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          <div className="h-64">
            <ComparisonChart data={analytics.strategyComparison} metric={selectedMetric as 'totalCost' | 'successRate' | 'averageQuality' | 'averageLatency' | 'costPerSuccess'} />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-6">
            <h3 className="text-base font-semibold text-zinc-100 mb-6">Cost Over Time</h3>
            <div className="h-64">
              <CostEfficiencyChart data={costEfficiencyData} />
            </div>
          </div>

          <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-6">
            <h3 className="text-base font-semibold text-zinc-100 mb-6">Token Usage</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                    itemStyle={{ color: '#8b5cf6' }}
                  />
                  <Area type="monotone" dataKey="tokenUsage" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTokens)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-6">
            <h3 className="text-base font-semibold text-zinc-100 mb-6">Model Distribution</h3>
            <div className="h-64">
              <ModelUsageChart data={analytics.modelDistribution} />
            </div>
          </div>

          <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-6">
            <h3 className="text-base font-semibold text-zinc-100 mb-6">Success Rate Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                    itemStyle={{ color: '#34d399' }}
                  />
                  <Line type="monotone" dataKey="successRate" stroke="#34d399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
