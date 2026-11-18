import React, { useState } from 'react';
import type { TraceStepData } from '../../data/types';
import { cn } from '../../lib/utils';

interface TraceStepProps {
  step: TraceStepData;
  isLast: boolean;
}

const TraceStep: React.FC<TraceStepProps> = ({ step, isLast }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={cn(
        'w-full cursor-pointer rounded-lg border p-3 transition-colors duration-150',
        expanded
          ? 'bg-[#ffffff04] border-[#2a2a35]'
          : 'bg-[#111113] border-[#1e1e24] hover:border-[#2a2a35]/70'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-200">{step.label}</span>
        <span className="text-xs font-mono text-zinc-500">{step.duration}ms</span>
      </div>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#1e1e24]">
          {step.description && (
            <p className="text-sm text-zinc-400 mb-3">{step.description}</p>
          )}
          
          {step.metadata && Object.keys(step.metadata).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(step.metadata).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs font-mono text-zinc-500">{key}</span>
                  <span className="text-xs font-mono text-zinc-300 break-all">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TraceStep;
