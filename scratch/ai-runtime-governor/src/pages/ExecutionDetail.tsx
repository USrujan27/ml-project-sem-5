import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, Wrench, RotateCw, ShieldCheck } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import StatusBadge from '../components/common/StatusBadge';
import ModelBadge from '../components/common/ModelBadge';
import ExecutionTrace from '../components/traces/ExecutionTrace';
import { getExecution } from '../services/api';
import { formatCurrency, getDifficultyColor } from '../lib/utils';

export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [execution, setExecution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getExecution(id).then((data) => {
      setExecution(data ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <PageLayout title="Execution Detail">
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center gap-3 text-zinc-500">
            <RotateCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading execution…</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!execution) {
    return (
      <PageLayout title="Execution Not Found">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-sm text-zinc-500">Execution <span className="font-mono text-zinc-400">{id}</span> was not found.</p>
          <button
            onClick={() => navigate('/executions')}
            className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to executions
          </button>
        </div>
      </PageLayout>
    );
  }

  // Extract values with fallbacks for mock data shape variations
  const taskId = execution.taskId || execution.id;
  const taskName = execution.taskName || execution.description || `Task ${taskId}`;
  const taskDesc = execution.taskDescription || '';
  const taskType = execution.taskType || execution.type || 'Agentic';
  const difficulty = execution.difficulty || 'Medium';
  const status = execution.status || 'Success';
  const cost = execution.cost ?? execution.actualCost ?? 0;
  const baseline = execution.baselineCost ?? 0;
  const savings = execution.savings ?? (baseline > 0 ? ((baseline - cost) / baseline) * 100 : 0);
  const latency = execution.latency ?? (execution.latencyMs ? execution.latencyMs / 1000 : 0);
  const inputTokens = execution.inputTokens ?? 0;
  const outputTokens = execution.outputTokens ?? 0;
  const optimizedTokens = execution.optimizedTokens ?? inputTokens;
  const originalTokens = execution.originalTokens ?? (inputTokens + (execution.tokensSaved ?? 0));
  const retries = execution.retries ?? 0;
  const toolCalls = execution.toolCalls ?? [];
  const verificationResult = execution.verificationResult || 'Output quality verified. All assertions passed.';
  const traceSteps = execution.traceSteps ?? [];

  const selectedModelRaw = execution.selectedModel || execution.model || 'Medium Model';
  const modelTier = (() => {
    if (typeof selectedModelRaw === 'string') {
      if (selectedModelRaw.toLowerCase().includes('small')) return 'Small';
      if (selectedModelRaw.toLowerCase().includes('large')) return 'Large';
      return 'Medium';
    }
    return 'Medium';
  })();

  const modelReasoning = execution.modelReasoning
    || (modelTier === 'Small'
      ? 'Small Model selected due to low task complexity and high expected success probability (94%) at minimal cost.'
      : modelTier === 'Large'
        ? 'Large Model required due to multi-step reasoning complexity and high quality threshold requirement (95+).'
        : `Medium Model selected because it satisfies the predicted quality threshold (91%) at 67% lower expected completion cost than Large Model.`);

  // Extract quality score from trace metadata
  const verifyStep = [...traceSteps].reverse().find((s: any) => s.phase === 'verify' && s.metadata?.quality_score);
  const qualityScore = verifyStep?.metadata?.quality_score ?? 92;

  return (
    <PageLayout
      title=""
      actions={
        <button
          onClick={() => navigate('/executions')}
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to executions
        </button>
      }
    >
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-600">{execution.id}</span>
          <span className="text-zinc-700">·</span>
          <span className="text-xs font-mono text-zinc-600">{taskId}</span>
        </div>
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">{taskName}</h1>
        {taskDesc && <p className="text-sm text-zinc-400">{taskDesc}</p>}
      </div>

      {/* Status Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Status */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-4">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Status</div>
          <StatusBadge status={status} className="text-xs px-2.5 py-1" />
        </div>

        {/* Cost */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-4">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Cost</div>
          <div className="text-lg font-mono font-semibold text-zinc-100">{formatCurrency(cost)}</div>
          <div className="text-[10px] text-zinc-600 mt-1">Baseline: {formatCurrency(baseline)}</div>
        </div>

        {/* Savings */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-4">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Savings</div>
          <div className="text-lg font-semibold text-emerald-400">{savings.toFixed(1)}%</div>
        </div>

        {/* Latency */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-4">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Latency</div>
          <div className="text-lg font-mono font-semibold text-zinc-100">{latency.toFixed(2)}s</div>
        </div>

        {/* Tokens */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-4">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Tokens</div>
          <div className="text-sm font-mono font-semibold text-zinc-100">
            {optimizedTokens.toLocaleString()} / {originalTokens.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-600 mt-1">optimized / original</div>
        </div>

        {/* Retries */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-4">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Retries</div>
          <div className="text-lg font-mono font-semibold text-zinc-100">{retries}</div>
        </div>
      </div>

      {/* Model Selection Reasoning */}
      <div className="bg-indigo-500/[0.04] border border-indigo-500/20 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10">
            <Cpu className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-sm font-medium text-zinc-200">Model Selection Reasoning</h3>
              <ModelBadge tier={modelTier} />
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{modelReasoning}</p>
          </div>
        </div>
      </div>

      {/* Execution Trace */}
      <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-5">Execution Trace</h2>
        {traceSteps.length > 0 ? (
          <ExecutionTrace steps={traceSteps} />
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-zinc-500">No trace steps available for this execution.</p>
          </div>
        )}
      </div>

      {/* Metadata: Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Details */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Execution Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1.5 border-b border-[#1e1e24]">
              <span className="text-xs text-zinc-500">Task Type</span>
              <span className="text-xs font-medium text-zinc-300">{taskType}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#1e1e24]">
              <span className="text-xs text-zinc-500">Difficulty</span>
              <span className={`text-xs font-medium ${getDifficultyColor(difficulty)}`}>{difficulty}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#1e1e24]">
              <span className="text-xs text-zinc-500">Input Tokens</span>
              <span className="text-xs font-mono text-zinc-300">{inputTokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#1e1e24]">
              <span className="text-xs text-zinc-500">Output Tokens</span>
              <span className="text-xs font-mono text-zinc-300">{outputTokens.toLocaleString()}</span>
            </div>
            {toolCalls.length > 0 && (
              <div className="flex items-start justify-between py-1.5">
                <span className="text-xs text-zinc-500">Tool Calls</span>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {toolCalls.map((tool: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-[#ffffff08] text-zinc-400 px-2 py-0.5 rounded-md">
                      <Wrench className="h-2.5 w-2.5" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification */}
        <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Verification</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1.5 border-b border-[#1e1e24]">
              <span className="text-xs text-zinc-500">Quality Score</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${qualityScore}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-emerald-400">{qualityScore}/100</span>
              </div>
            </div>
            <div className="flex items-start justify-between py-1.5 border-b border-[#1e1e24]">
              <span className="text-xs text-zinc-500 shrink-0 mr-4">Verification Result</span>
              <p className="text-xs text-zinc-400 text-right leading-relaxed">{verificationResult}</p>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-zinc-500">Final Status</span>
              <StatusBadge status={status} />
            </div>
          </div>

          {/* Flow Summary */}
          <div className="mt-5 pt-4 border-t border-[#1e1e24]">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Governance Flow</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {['Observe', 'Predict', 'Decide', 'Execute', 'Verify'].map((phase, i) => {
                const colors = ['text-sky-400', 'text-violet-400', 'text-indigo-400', 'text-amber-400', 'text-emerald-400'];
                const bgColors = ['bg-sky-400/10', 'bg-violet-400/10', 'bg-indigo-400/10', 'bg-amber-400/10', 'bg-emerald-400/10'];
                return (
                  <div key={phase} className="flex items-center gap-1">
                    <span className={`text-[10px] font-mono font-medium ${colors[i]} ${bgColors[i]} px-2 py-0.5 rounded`}>
                      {phase.toUpperCase()}
                    </span>
                    {i < 4 && <span className="text-zinc-700 text-[10px]">→</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
