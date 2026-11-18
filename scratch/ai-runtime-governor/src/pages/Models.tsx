import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import ModelBadge from '../components/common/ModelBadge';
import CostQualityChart from '../components/charts/CostQualityChart';
import { getModels } from '../services/api';
import type { Model } from '../data/types';

export default function Models() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);

  useEffect(() => {
    getModels().then((data) => {
      setModels(data);
      setLoading(false);
    });
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedModelId(expandedModelId === id ? null : id);
  };

  return (
    <PageLayout 
      title="Models" 
      description="Compare model cost, quality, latency and task suitability."
    >
      <div className="space-y-6">
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 bg-[#1a1a1f] border-b border-[#1e1e24]">
                <tr>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Input Cost (/1k)</th>
                  <th className="px-4 py-3 font-medium">Output Cost (/1k)</th>
                  <th className="px-4 py-3 font-medium">Avg Latency</th>
                  <th className="px-4 py-3 font-medium">Success Rate</th>
                  <th className="px-4 py-3 font-medium">Quality Score</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Recommended Tasks</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                      Loading models...
                    </td>
                  </tr>
                ) : (
                  models.map((model) => (
                    <React.Fragment key={model.id}>
                      <tr 
                        className={`border-b border-[#1e1e24] hover:bg-[#ffffff05] cursor-pointer transition-colors ${expandedModelId === model.id ? 'bg-[#ffffff05]' : ''}`}
                        onClick={() => toggleExpand(model.id)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ModelBadge tier={model.tier} />
                            <span className="text-zinc-50 font-medium">{model.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-zinc-400">{model.provider}</td>
                        <td className="px-4 py-4 font-mono text-zinc-300">₹{model.inputCostPer1k.toFixed(4)}</td>
                        <td className="px-4 py-4 font-mono text-zinc-300">₹{model.outputCostPer1k.toFixed(4)}</td>
                        <td className="px-4 py-4 font-mono text-zinc-300">{model.averageLatency}s</td>
                        <td className="px-4 py-4">
                          <span className={`${model.successRate > 95 ? 'text-emerald-400' : model.successRate > 90 ? 'text-amber-400' : 'text-red-400'}`}>
                            {model.successRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[#1e1e24] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500"
                                style={{ width: `${model.qualityScore}%` }}
                              />
                            </div>
                            <span className="text-zinc-300">{model.qualityScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {model.recommendedTasks.slice(0, 2).map(task => (
                              <span key={task} className="bg-[#ffffff08] text-zinc-400 text-[10px] px-1.5 py-0.5 rounded">
                                {task}
                              </span>
                            ))}
                            {model.recommendedTasks.length > 2 && (
                              <span className="text-zinc-500 text-xs">+{model.recommendedTasks.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-zinc-500">
                          {expandedModelId === model.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>
                      
                      {expandedModelId === model.id && (
                        <tr>
                          <td colSpan={9} className="p-0 border-b border-[#1e1e24] bg-[#0c0c0f]">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-zinc-200 mb-3">Cost Breakdown</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Input (per 1k)</span>
                                    <span className="font-mono text-zinc-300">₹{model.inputCostPer1k.toFixed(4)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Output (per 1k)</span>
                                    <span className="font-mono text-zinc-300">₹{model.outputCostPer1k.toFixed(4)}</span>
                                  </div>
                                  <div className="pt-2 mt-2 border-t border-[#1e1e24] flex justify-between font-medium">
                                    <span className="text-zinc-200">Context Window</span>
                                    <span className="font-mono text-zinc-300">{model.contextWindow.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-zinc-200 mb-3">Performance Profile</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Success Rate</span>
                                    <span className="font-mono text-emerald-400">{model.successRate.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Quality Score</span>
                                    <span className="font-mono text-zinc-300">{model.qualityScore}/100</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Avg Latency</span>
                                    <span className="font-mono text-zinc-300">{model.averageLatency}s</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-zinc-200 mb-3">Task Suitability</h4>
                                <ul className="space-y-1">
                                  {model.recommendedTasks.map(task => (
                                    <li key={task} className="flex items-center gap-2 text-sm text-zinc-300">
                                      <Check size={14} className="text-indigo-400" />
                                      {task}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && models.length > 0 && (
          <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-6">
            <h3 className="text-base font-semibold text-zinc-100 mb-6">Cost-Quality Tradeoff</h3>
            <div className="h-80 w-full mb-4">
              <CostQualityChart models={models} />
            </div>
            <p className="text-xs text-zinc-500 text-center">
              The Governor selects the optimal model based on predicted task difficulty, balancing cost and quality requirements.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
