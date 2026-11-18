import React from 'react';
import type { TraceStepData } from '../../data/types';
import TraceStep from './TraceStep';
import { cn } from '../../lib/utils';

interface ExecutionTraceProps {
  steps: TraceStepData[];
  className?: string;
}

const getPhaseColor = (phase: string) => {
  switch (phase.toLowerCase()) {
    case 'observe': return 'text-sky-400 bg-sky-400';
    case 'predict': return 'text-violet-400 bg-violet-400';
    case 'decide': return 'text-indigo-400 bg-indigo-400';
    case 'execute': return 'text-amber-400 bg-amber-400';
    case 'verify': return 'text-emerald-400 bg-emerald-400';
    default: return 'text-zinc-400 bg-zinc-400';
  }
};

const getPhaseTextColor = (phase: string) => {
  switch (phase.toLowerCase()) {
    case 'observe': return 'text-sky-400';
    case 'predict': return 'text-violet-400';
    case 'decide': return 'text-indigo-400';
    case 'execute': return 'text-amber-400';
    case 'verify': return 'text-emerald-400';
    default: return 'text-zinc-400';
  }
};

const ExecutionTrace: React.FC<ExecutionTraceProps> = ({ steps, className }) => {
  return (
    <div className={cn('w-full relative font-sans', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const phaseColor = getPhaseColor(step.phase);
        const phaseTextColor = getPhaseTextColor(step.phase);
        
        // Show phase label only if it's the first step of this phase
        const showPhaseLabel = index === 0 || steps[index - 1].phase !== step.phase;
        
        return (
          <div key={step.id || index} className="flex flex-row relative mb-6">
            
            {/* Left side: Phase label and connector line */}
            <div className="w-24 shrink-0 flex flex-col items-end pr-4 relative">
              {showPhaseLabel && (
                <span className={cn('text-[10px] font-mono uppercase tracking-widest mt-1', phaseTextColor)}>
                  {step.phase}
                </span>
              )}
              <span className="text-[10px] font-mono text-zinc-600 mt-1">
                +{step.timestamp}ms
              </span>
            </div>

            {/* Timeline track and dot */}
            <div className="relative flex flex-col items-center mr-4">
              <div className={cn('w-2.5 h-2.5 rounded-full z-10 mt-2 shadow-[0_0_8px_rgba(0,0,0,0.5)]', phaseColor.split(' ')[1])} />
              
              {!isLast && (
                <div className="absolute top-4 bottom-[-24px] w-px bg-gradient-to-b from-[#2a2a35] to-[#1e1e24]" />
              )}
            </div>

            {/* Content card */}
            <div className="flex-grow min-w-0">
              <TraceStep step={step} isLast={isLast} />
            </div>
            
          </div>
        );
      })}
    </div>
  );
};

export default ExecutionTrace;
