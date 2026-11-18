import type { Execution, TaskType, TaskDifficulty, ModelTier, TaskStatus } from './types';

const taskTypes: TaskType[] = ['Agentic', 'Summary', 'Reasoning', 'Coding', 'Classification', 'Conversational', 'Extraction'];
const difficulties: TaskDifficulty[] = ['Easy', 'Medium', 'Hard'];
const modelTiers: ModelTier[] = ['Small', 'Medium', 'Large'];
const statuses: TaskStatus[] = ['Success', 'Success', 'Success', 'Success', 'Failed', 'Success', 'Success', 'Retrying', 'Success', 'Success', 'Success', 'Success', 'Success', 'Failed', 'Success'];
const taskNames = [
  'Customer refund analysis',
  'Document summarization',
  'Financial risk analysis',
  'Code debugging',
  'Sentiment classification',
  'Multi-step research',
  'Email draft',
  'Contract analysis',
  'Automated data pipeline generation',
  'Meeting notes summary',
  'React component refactor',
  'Support ticket routing',
  'Legal document review',
  'System health check automation',
  'End-to-end testing generation',
];

type Meta = Record<string, string | number | boolean>;

export const mockExecutions: Execution[] = Array.from({ length: 15 }).map((_, i) => {
  const baseTime = Date.now() - 1000 * 60 * 60 * (i + 1);
  const difficulty = difficulties[i % 3];
  const selectedModel = modelTiers[i % 3];
  const status = statuses[i];
  const cost = +(0.05 + Math.random() * 1.5).toFixed(2);
  const baselineCost = +(cost * (1.4 + Math.random() * 0.6)).toFixed(2);
  const latency = +(0.5 + Math.random() * 5).toFixed(2);
  const inputTokens = 1000 + Math.floor(Math.random() * 12000);
  const outputTokens = 50 + Math.floor(Math.random() * 3000);
  const originalTokens = inputTokens + Math.floor(Math.random() * 1500);
  const optimizedTokens = Math.floor(inputTokens * (0.5 + Math.random() * 0.3));

  const step1Meta: Meta = { source: 'api_endpoint' };
  const step2Meta: Meta = {
    predicted_difficulty: difficulty,
    confidence: +(0.89 + (i % 10) * 0.01).toFixed(2),
    features_used: 12,
  };
  const step3Meta: Meta = {
    estimated_cost_small: 0.05,
    estimated_cost_medium: 0.40,
    estimated_cost_large: 1.50,
  };
  const step4Meta: Meta = {
    selected_model: `${selectedModel} Model`,
    expected_quality: 92,
    expected_cost: 0.38,
  };
  const step5Meta: Meta = {
    original_tokens: originalTokens,
    optimized_tokens: optimizedTokens,
    compression_ratio: 0.6,
  };
  const step6Meta: Meta = {
    model: `${selectedModel} Model`,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    latency_ms: 1020,
  };
  const step7Meta: Meta = {
    tool_name: 'CRM Lookup',
    tool_result: 'success',
  };
  const step8Meta: Meta = {
    quality_score: 92 + (i % 5),
    confidence: 0.95,
    passed_threshold: true,
  };
  const step9Meta: Meta = {
    final_status: status === 'Success' ? 'passed' : 'failed',
    total_cost: cost,
    savings_pct: 65,
  };

  return {
    id: `EXEC-849${i}`,
    taskId: `TSK-1049${i + 1}`,
    taskName: taskNames[i],
    taskDescription: `Execution trace for task: ${taskNames[i]}`,
    taskType: taskTypes[i % taskTypes.length],
    difficulty,
    selectedModel,
    modelReasoning: selectedModel === 'Small'
      ? 'Small Model selected due to low task complexity and high expected success probability (94%) at minimal cost.'
      : selectedModel === 'Large'
        ? 'Large Model required due to multi-step reasoning complexity and high quality threshold requirement (95+).'
        : 'Medium Model selected because it satisfies the predicted quality threshold (91%) at 67% lower expected completion cost than Large Model.',
    status,
    cost,
    baselineCost,
    savings: +((1 - cost / baselineCost) * 100).toFixed(1),
    latency,
    inputTokens,
    outputTokens,
    optimizedTokens,
    originalTokens,
    retries: status === 'Failed' ? 2 : status === 'Retrying' ? 1 : 0,
    toolCalls: i % 3 === 0 ? ['CRM Lookup', 'Database Query'] : i % 2 === 0 ? ['Web Search'] : [],
    verificationResult: status === 'Failed'
      ? 'Output quality below threshold. Maximum retries exhausted.'
      : 'Output quality verified. All assertions passed.',
    createdAt: new Date(baseTime).toISOString(),
    completedAt: status === 'Running' ? null : new Date(baseTime + latency * 1000).toISOString(),
    traceSteps: [
      {
        id: `STEP-${i}-1`,
        timestamp: new Date(baseTime + 10).toISOString(),
        phase: 'observe',
        label: 'Task received',
        description: 'Initial task parameters observed and recorded',
        duration: 15,
        metadata: step1Meta,
        status: 'completed',
      },
      {
        id: `STEP-${i}-2`,
        timestamp: new Date(baseTime + 50).toISOString(),
        phase: 'predict',
        label: 'Task difficulty predicted',
        description: 'Analyzed task to estimate complexity',
        duration: 40,
        metadata: step2Meta,
        status: 'completed',
      },
      {
        id: `STEP-${i}-3`,
        timestamp: new Date(baseTime + 80).toISOString(),
        phase: 'predict',
        label: 'Cost estimation',
        description: 'Predicted resource costs across model tiers',
        duration: 30,
        metadata: step3Meta,
        status: 'completed',
      },
      {
        id: `STEP-${i}-4`,
        timestamp: new Date(baseTime + 120).toISOString(),
        phase: 'decide',
        label: 'Model selection',
        description: 'Selected optimal model based on predictions',
        duration: 40,
        metadata: step4Meta,
        status: 'completed',
      },
      {
        id: `STEP-${i}-5`,
        timestamp: new Date(baseTime + 180).toISOString(),
        phase: 'execute',
        label: 'Context optimization',
        description: 'Compressed prompt to save tokens',
        duration: 60,
        metadata: step5Meta,
        status: 'completed',
      },
      {
        id: `STEP-${i}-6`,
        timestamp: new Date(baseTime + 1200).toISOString(),
        phase: 'execute',
        label: 'LLM request',
        description: 'Forwarded task to chosen LLM',
        duration: 1020,
        metadata: step6Meta,
        status: 'completed',
      },
      {
        id: `STEP-${i}-7`,
        timestamp: new Date(baseTime + 1500).toISOString(),
        phase: 'execute',
        label: 'Tool call',
        description: 'LLM invoked external tools',
        duration: 300,
        metadata: step7Meta,
        status: 'completed',
      },
      {
        id: `STEP-${i}-8`,
        timestamp: new Date(baseTime + 1700).toISOString(),
        phase: 'verify',
        label: 'Verification',
        description: 'Evaluated LLM output against requirements',
        duration: 200,
        metadata: step8Meta,
        status: 'completed',
      },
      {
        id: `STEP-${i}-9`,
        timestamp: new Date(baseTime + 1750).toISOString(),
        phase: 'verify',
        label: 'Result',
        description: 'Final execution result synthesized',
        duration: 50,
        metadata: step9Meta,
        status: 'completed',
      },
    ],
  };
});
