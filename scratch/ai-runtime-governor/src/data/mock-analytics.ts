import type { AnalyticsData } from './types';

export const mockAnalytics: AnalyticsData = {
  timeSeries: Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const randomVariation = Math.random() * 20 - 10;
    return {
      timestamp: d.toISOString(),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actualCost: 160 + randomVariation,
      baselineCost: 240 + randomVariation * 1.5,
      tokenUsage: 400000 + randomVariation * 10000,
      llmCalls: 400 + randomVariation * 5,
      successRate: 95.5 + Math.random() * 1.5,
      latency: 1.8 + Math.random() * 0.3,
      retryRate: 4.5 + Math.random() * 1.5,
      costPerSuccess: 0.40 + Math.random() * 0.05
    };
  }),
  modelDistribution: [
    { model: 'Small', percentage: 62, calls: 7739, cost: 619 },
    { model: 'Medium', percentage: 27, calls: 3370, cost: 2156 },
    { model: 'Large', percentage: 11, calls: 1373, cost: 2045 }
  ],
  strategyComparison: [
    { strategy: 'Fixed Large Model', totalCost: 14200, successRate: 98, averageQuality: 97, averageLatency: 3.2, costPerSuccess: 1.16 },
    { strategy: 'Fixed Small Model', totalCost: 1860, successRate: 78, averageQuality: 72, averageLatency: 0.8, costPerSuccess: 0.19 },
    { strategy: 'Simple Router', totalCost: 6400, successRate: 89, averageQuality: 85, averageLatency: 1.9, costPerSuccess: 0.58 },
    { strategy: 'AI Runtime Governor', totalCost: 4820, successRate: 96.4, averageQuality: 93, averageLatency: 1.82, costPerSuccess: 0.40 }
  ],
  summary: {
    totalCost: 4820,
    totalTokens: 12400000,
    totalCalls: 12482,
    averageLatency: 1.82,
    successRate: 96.4,
    retryRate: 4.2,
    costPerSuccess: 0.40
  }
};
