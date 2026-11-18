import type { Task, Execution, Model, AnalyticsData, Policy, Evaluation, KPIMetrics, ExperimentStrategy } from '../data/types';
import { mockTasks } from '../data/mock-tasks';
import { mockModels } from '../data/mock-models';
import { mockPolicies } from '../data/mock-policies';
import mlResults from '../data/ml_results.json';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface MLEngineStatus {
  connected: boolean;
  generatedAt: string;
  totalTasks: number;
  totalTokens: number;
  optimalK: number;
  wcss: number;
  silhouetteScore: number;
  routingAccuracy: number;
  hmmStates: number;
  hmmLogLikelihood: number;
  premiumPersistence: number;
  savingsPercent: number;
  savingsRupees: number;
  speedupFactor: number;
}

export async function getMLEngineStatus(): Promise<MLEngineStatus> {
  await delay(50);
  return {
    connected: true,
    generatedAt: mlResults.generated_at,
    totalTasks: mlResults.dataset_info.total_tasks,
    totalTokens: mlResults.dataset_info.total_tokens,
    optimalK: mlResults.kmeans.optimal_k,
    wcss: mlResults.kmeans.wcss,
    silhouetteScore: mlResults.kmeans.silhouette_score,
    routingAccuracy: mlResults.kmeans.routing_accuracy,
    hmmStates: mlResults.hmm.num_states,
    hmmLogLikelihood: mlResults.hmm.log_likelihood,
    premiumPersistence: mlResults.hmm.premium_persistence_pct,
    savingsPercent: mlResults.comparison.savings.percent,
    savingsRupees: mlResults.comparison.savings.rupees,
    speedupFactor: mlResults.comparison.savings.speedup,
  };
}

export async function getOverviewKPIs(): Promise<KPIMetrics> {
  await delay(80);
  return mlResults.dashboard_kpis as KPIMetrics;
}

export async function getTasks(): Promise<Task[]> {
  await delay(80);
  return mockTasks;
}

export async function getTask(id: string): Promise<Task | undefined> {
  await delay(50);
  return mockTasks.find(t => t.id === id);
}

export async function getExecutions(): Promise<Execution[]> {
  await delay(80);
  return mlResults.executions as unknown as Execution[];
}

export async function getExecution(id: string): Promise<Execution | undefined> {
  await delay(50);
  const execs = mlResults.executions as unknown as Execution[];
  return execs.find(e => e.id === id);
}

export async function getModels(): Promise<Model[]> {
  await delay(50);
  return mockModels;
}

export async function getModel(id: string): Promise<Model | undefined> {
  await delay(50);
  return mockModels.find(m => m.id === id);
}

export async function getAnalytics(): Promise<AnalyticsData> {
  await delay(80);
  const comp = mlResults.comparison;
  const numTasks = mlResults.dataset_info.total_tasks;

  return {
    timeSeries: mlResults.time_series as any,
    modelDistribution: mlResults.model_distribution as any,
    strategyComparison: [
      {
        strategy: 'Always-Large (Baseline)',
        totalCost: comp.always_large.cost,
        successRate: comp.always_large.accuracy,
        averageQuality: 98.0,
        averageLatency: comp.always_large.latency,
        costPerSuccess: comp.always_large.cost_per_success,
      },
      {
        strategy: 'Random Routing',
        totalCost: comp.random.cost,
        successRate: comp.random.accuracy,
        averageQuality: 65.0,
        averageLatency: comp.random.latency,
        costPerSuccess: comp.random.cost_per_success,
      },
      {
        strategy: 'AI Runtime Governor (K-Means + HMM)',
        totalCost: comp.governor.cost,
        successRate: comp.governor.accuracy,
        averageQuality: 94.8,
        averageLatency: comp.governor.latency,
        costPerSuccess: comp.governor.cost_per_success,
      },
    ],
    summary: {
      totalCost: comp.governor.cost,
      totalTokens: mlResults.dataset_info.total_tokens,
      totalCalls: numTasks,
      averageLatency: comp.governor.latency,
      successRate: comp.governor.accuracy,
      retryRate: 3.5,
      costPerSuccess: comp.governor.cost_per_success,
    },
  };
}

export async function getPolicies(): Promise<Policy[]> {
  await delay(50);
  return mockPolicies;
}

export async function updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy> {
  await delay(50);
  const policyIndex = mockPolicies.findIndex(p => p.id === id);
  if (policyIndex === -1) {
    throw new Error('Policy not found');
  }
  const updatedPolicy = { ...mockPolicies[policyIndex], ...updates };
  mockPolicies[policyIndex] = updatedPolicy;
  return updatedPolicy;
}

export async function getEvaluations(): Promise<Evaluation[]> {
  await delay(80);
  const comp = mlResults.comparison;
  const numTasks = mlResults.dataset_info.total_tasks;

  const evals: Evaluation[] = [
    {
      id: 'EVAL-001',
      name: 'PBL-II Core Model Benchmark',
      description: 'Comparative routing performance across 500 tasks (Always-Large vs Random vs K-Means Governor).',
      dataset: 'AI Task Execution Logs (PBL-II)',
      datasetSize: numTasks,
      status: 'completed',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      strategies: [
        {
          name: 'Always-Large (Baseline)',
          metrics: {
            successRate: comp.always_large.accuracy,
            averageCost: comp.always_large.cost / numTasks,
            costPerSuccess: comp.always_large.cost_per_success,
            averageLatency: comp.always_large.latency,
            averageQuality: 98.0,
            totalTasks: numTasks,
          },
        },
        {
          name: 'Random Routing',
          metrics: {
            successRate: comp.random.accuracy,
            averageCost: comp.random.cost / numTasks,
            costPerSuccess: comp.random.cost_per_success,
            averageLatency: comp.random.latency,
            averageQuality: 65.0,
            totalTasks: numTasks,
          },
        },
        {
          name: 'AI Runtime Governor (K-Means + HMM)',
          metrics: {
            successRate: comp.governor.accuracy,
            averageCost: comp.governor.cost / numTasks,
            costPerSuccess: comp.governor.cost_per_success,
            averageLatency: comp.governor.latency,
            averageQuality: 94.8,
            totalTasks: numTasks,
          },
        },
      ],
    },
  ];

  // If PBL-III ensemble analysis exists, include EVAL-002
  const ens = (mlResults as any).ensemble_analysis;
  if (ens && ens.comparison_table) {
    const strategies: ExperimentStrategy[] = ens.comparison_table.map((m: any) => ({
      name: m.Model,
      metrics: {
        successRate: m.Accuracy,
        averageCost: 0.000086,
        costPerSuccess: 0.000086 / (m.Accuracy / 100.0),
        averageLatency: (m['Latency (us/task)'] || 1000.0) / 1000.0,
        averageQuality: m['F1-Score (Macro)'],
        totalTasks: 100,
      }
    }));

    evals.push({
      id: 'EVAL-002',
      name: 'PBL-III Supervised Ensemble Learning Benchmark',
      description: 'Comprehensive evaluation of 7 Machine Learning architectures on unseen test data (Accuracy, Macro F1, Latency, ROC-AUC).',
      dataset: 'Held-out Stratified Test Telemetry (PBL-III)',
      datasetSize: 100,
      status: 'completed',
      createdAt: ens.generated_at || new Date().toISOString(),
      completedAt: ens.generated_at || new Date().toISOString(),
      strategies: strategies
    });
  }

  return evals;
}

export async function getEvaluation(id: string): Promise<Evaluation | undefined> {
  await delay(50);
  const evals = await getEvaluations();
  return evals.find(e => e.id === id);
}
