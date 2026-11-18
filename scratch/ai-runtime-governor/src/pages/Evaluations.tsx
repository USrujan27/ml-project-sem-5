import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import StatusBadge from '../components/common/StatusBadge';
import MetricCard from '../components/common/MetricCard';
import { getEvaluations } from '../services/api';
import type { Evaluation, ExperimentStrategy } from '../data/types';

export default function Evaluations() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getEvaluations().then(data => {
      setEvaluations(data);
      if (data.length > 0) {
        setExpandedId(data[0].id);
      }
      setLoading(false);
    });
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatCurrency = (val: number) => `₹${val.toFixed(4)}`;

  // Flatten strategies for recharts — recharts needs { strategy, ...metrics }
  function flatForChart(strategies: ExperimentStrategy[]) {
    return strategies.map(s => ({
      strategy: s.name,
      successRate: s.metrics.successRate,
      costPerSuccess: s.metrics.costPerSuccess,
      averageCost: s.metrics.averageCost,
      averageLatency: s.metrics.averageLatency,
      averageQuality: s.metrics.averageQuality,
      totalTasks: s.metrics.totalTasks,
    }));
  }

  return (
    <PageLayout 
      title="Evaluations" 
      description="Run and compare model routing experiments to optimize cost and quality."
    >
      <div className="space-y-4">
        {loading ? (
          <div className="text-zinc-500 text-center py-12">Loading evaluations...</div>
        ) : (
          evaluations.map(evaluation => {
            const isExpanded = expandedId === evaluation.id;
            const governorStrategy = evaluation.strategies.find(
              s => s.name === 'AI Runtime Governor' || s.name.includes('Governor')
            );
            const chartData = flatForChart(evaluation.strategies);

            return (
              <div key={evaluation.id} className="bg-[#111113] border border-[#1e1e24] rounded-lg overflow-hidden">
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#ffffff05] transition-colors"
                  onClick={() => toggleExpand(evaluation.id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-3">
                        {evaluation.name}
                        <StatusBadge status={evaluation.status} />
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                        <span>{evaluation.dataset} ({evaluation.datasetSize} tasks)</span>
                        <span>·</span>
                        <span>{new Date(evaluation.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-zinc-500">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && evaluation.strategies.length > 0 && (
                  <div className="p-6 border-t border-[#1e1e24] bg-[#0c0c0f]">
                    {/* Governor Highlight */}
                    {governorStrategy && (
                      <div className="mb-8">
                        <h4 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Governor Performance</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <MetricCard 
                            label="Success Rate" 
                            value={`${governorStrategy.metrics.successRate.toFixed(1)}%`}
                          />
                          <MetricCard 
                            label="Avg Cost" 
                            value={formatCurrency(governorStrategy.metrics.averageCost)}
                          />
                          <MetricCard 
                            label="Cost / Success" 
                            value={formatCurrency(governorStrategy.metrics.costPerSuccess)}
                          />
                          <MetricCard 
                            label="Avg Latency" 
                            value={`${governorStrategy.metrics.averageLatency}s`}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Visual Comparison */}
                      <div>
                        <h4 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Strategy Comparison</h4>
                        <div className="h-64 bg-[#111113] p-4 rounded-lg border border-[#1e1e24]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                              <XAxis
                                dataKey="strategy"
                                stroke="#52525b"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v: string) => v.replace('AI Runtime Governor', 'Governor')}
                              />
                              <YAxis yAxisId="left" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
                              <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `₹${v.toFixed(2)}`} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Bar yAxisId="left" dataKey="successRate" name="Success Rate" fill="#6366f1" radius={[2, 2, 0, 0]} />
                              <Bar yAxisId="right" dataKey="costPerSuccess" name="Cost/Success" fill="#fbbf24" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Data Table */}
                      <div>
                        <h4 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Detailed Metrics</h4>
                        <div className="overflow-x-auto bg-[#111113] rounded-lg border border-[#1e1e24]">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-400 border-b border-[#1e1e24]">
                              <tr>
                                <th className="px-4 py-3 font-medium">Strategy</th>
                                <th className="px-4 py-3 font-medium text-right">Success</th>
                                <th className="px-4 py-3 font-medium text-right">Avg Cost</th>
                                <th className="px-4 py-3 font-medium text-right">Cost/Succ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {evaluation.strategies.map((strat, i) => {
                                const isGov = strat.name === 'AI Runtime Governor';
                                return (
                                  <tr key={i} className={`border-b border-[#1e1e24]/50 last:border-0 ${isGov ? 'bg-indigo-500/10' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-zinc-200">
                                      {strat.name.replace('AI Runtime Governor', 'Governor')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-emerald-400">
                                      {strat.metrics.successRate.toFixed(1)}%
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-zinc-300">
                                      {formatCurrency(strat.metrics.averageCost)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-zinc-300">
                                      {formatCurrency(strat.metrics.costPerSuccess)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isExpanded && evaluation.strategies.length === 0 && (
                  <div className="p-6 border-t border-[#1e1e24] bg-[#0c0c0f] text-center text-sm text-zinc-500">
                    Evaluation in progress — results will appear here when complete.
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </PageLayout>
  );
}
