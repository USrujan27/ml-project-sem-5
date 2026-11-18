// ─── Core Enums ───────────────────────────────────────────────────────────────

export type TaskType = 'Agentic' | 'Summary' | 'Reasoning' | 'Coding' | 'Extraction' | 'Classification' | 'Conversational';
export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard';
export type TaskStatus = 'Success' | 'Failed' | 'Running' | 'Queued' | 'Retrying' | 'Escalated';
export type ModelTier = 'Small' | 'Medium' | 'Large';
export type PolicyType = 'budget' | 'iteration' | 'probability' | 'quality' | 'escalation' | 'optimization' | 'custom';
export type TracePhase = 'observe' | 'predict' | 'decide' | 'execute' | 'verify';

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  difficulty: TaskDifficulty;
  selectedModel: ModelTier;
  expectedCost: number;
  actualCost: number;
  baselineCost: number;
  successProbability: number;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
  latency: number;
  tokensSaved: number;
  inputTokens: number;
  outputTokens: number;
  retries: number;
}

// ─── Execution Trace ──────────────────────────────────────────────────────────

export interface TraceStepData {
  id: string;
  timestamp: string;
  phase: TracePhase;
  label: string;
  description: string;
  duration: number; // ms
  metadata: Record<string, string | number | boolean>;
  status: 'completed' | 'running' | 'error';
}

export interface Execution {
  id: string;
  taskId: string;
  taskName: string;
  taskDescription: string;
  taskType: TaskType;
  difficulty: TaskDifficulty;
  selectedModel: ModelTier;
  modelReasoning: string;
  status: TaskStatus;
  cost: number;
  baselineCost: number;
  savings: number; // percentage
  latency: number;
  inputTokens: number;
  outputTokens: number;
  optimizedTokens: number;
  originalTokens: number;
  retries: number;
  toolCalls: string[];
  verificationResult: string;
  createdAt: string;
  completedAt: string | null;
  traceSteps: TraceStepData[];
}

// ─── Model ────────────────────────────────────────────────────────────────────

export interface Model {
  id: string;
  name: string;
  tier: ModelTier;
  provider: string;
  inputCostPer1k: number;
  outputCostPer1k: number;
  averageLatency: number;
  successRate: number;
  qualityScore: number;
  recommendedTasks: TaskType[];
  totalCalls: number;
  totalCost: number;
  contextWindow: number;
  description: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  timestamp: string;
  label: string;
  actualCost: number;
  baselineCost: number;
  tokenUsage: number;
  llmCalls: number;
  successRate: number;
  latency: number;
  retryRate: number;
  costPerSuccess: number;
}

export interface ModelDistribution {
  model: ModelTier;
  percentage: number;
  calls: number;
  cost: number;
}

export interface StrategyComparison {
  strategy: string;
  totalCost: number;
  successRate: number;
  averageQuality: number;
  averageLatency: number;
  costPerSuccess: number;
}

export interface AnalyticsData {
  timeSeries: TimeSeriesPoint[];
  modelDistribution: ModelDistribution[];
  strategyComparison: StrategyComparison[];
  summary: {
    totalCost: number;
    totalTokens: number;
    totalCalls: number;
    averageLatency: number;
    successRate: number;
    retryRate: number;
    costPerSuccess: number;
  };
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

export interface KPIMetrics {
  totalSpend: number;
  baselineSpend: number;
  costSavings: number; // percentage
  successfulTasks: number; // percentage
  costPerSuccess: number;
  totalLLMCalls: number;
  trendsVsPrevious: {
    spend: number;
    savings: number;
    successRate: number;
    costPerSuccess: number;
    llmCalls: number;
  };
}

// ─── Policy ───────────────────────────────────────────────────────────────────

export interface Policy {
  id: string;
  name: string;
  description: string;
  type: PolicyType;
  value: string | number | boolean;
  unit?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

export interface ExperimentMetrics {
  successRate: number;
  averageCost: number;
  costPerSuccess: number;
  averageLatency: number;
  averageQuality: number;
  totalTasks: number;
}

export interface ExperimentStrategy {
  name: string;
  metrics: ExperimentMetrics;
}

export interface Evaluation {
  id: string;
  name: string;
  description: string;
  dataset: string;
  datasetSize: number;
  status: 'completed' | 'running' | 'pending';
  createdAt: string;
  completedAt: string | null;
  strategies: ExperimentStrategy[];
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}
