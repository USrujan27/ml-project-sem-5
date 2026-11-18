import type { Evaluation } from './types';

export const mockEvaluations: Evaluation[] = [
  {
    id: 'EVAL-001',
    name: 'Model Routing v1',
    description: 'Evaluate model routing strategies across a benchmark dataset of 1,000 diverse AI tasks.',
    dataset: 'AI Task Benchmark — 1,000 Tasks',
    datasetSize: 1000,
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
    strategies: [
      { name: 'Fixed Large Model', metrics: { successRate: 97.8, averageCost: 1.14, costPerSuccess: 1.16, averageLatency: 3.21, averageQuality: 96.5, totalTasks: 1000 } },
      { name: 'Fixed Small Model', metrics: { successRate: 78.2, averageCost: 0.15, costPerSuccess: 0.19, averageLatency: 0.81, averageQuality: 72.1, totalTasks: 1000 } },
      { name: 'Simple Router', metrics: { successRate: 88.9, averageCost: 0.51, costPerSuccess: 0.58, averageLatency: 1.92, averageQuality: 84.7, totalTasks: 1000 } },
      { name: 'AI Runtime Governor', metrics: { successRate: 95.4, averageCost: 0.41, costPerSuccess: 0.43, averageLatency: 1.74, averageQuality: 92.8, totalTasks: 1000 } },
    ]
  },
  {
    id: 'EVAL-002',
    name: 'Context Optimization v2',
    description: 'Compare context optimization techniques on long document tasks.',
    dataset: 'Long Document Suite — 500 Tasks',
    datasetSize: 500,
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    strategies: [
      { name: 'No Optimization', metrics: { successRate: 94.2, averageCost: 0.85, costPerSuccess: 0.90, averageLatency: 2.10, averageQuality: 91.5, totalTasks: 500 } },
      { name: 'Governor Optimized', metrics: { successRate: 93.8, averageCost: 0.45, costPerSuccess: 0.48, averageLatency: 1.85, averageQuality: 91.0, totalTasks: 500 } },
    ]
  },
  {
    id: 'EVAL-003',
    name: 'Escalation Policy Test',
    description: 'Test escalation policies on edge case scenarios.',
    dataset: 'Edge Case Collection — 200 Tasks',
    datasetSize: 200,
    status: 'running',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    completedAt: null,
    strategies: []
  }
];
