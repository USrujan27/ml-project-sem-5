import React from 'react';
import type { Policy } from '../../data/types';
import { cn } from '../../lib/utils';

interface PolicyCardProps {
  policy: Policy;
  onToggle?: (enabled: boolean) => void;
  onEdit?: (id: string) => void;
  className?: string;
}

function formatPolicyValue(policy: Policy): string {
  if (typeof policy.value === 'boolean') {
    return policy.value ? 'Enabled' : 'Disabled';
  }
  if (typeof policy.value === 'number') {
    return policy.unit ? `${policy.value}${policy.unit}` : String(policy.value);
  }
  return String(policy.value);
}

const PolicyCard: React.FC<PolicyCardProps> = ({
  policy,
  onToggle,
  onEdit,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-[#111113] border border-[#1e1e24] rounded-lg p-4 flex flex-col',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-zinc-200 pr-3">{policy.name}</h4>
        
        <button
          type="button"
          role="switch"
          aria-checked={policy.enabled}
          onClick={() => onToggle && onToggle(!policy.enabled)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 focus:outline-none',
            policy.enabled ? 'bg-indigo-500' : 'bg-zinc-700'
          )}
        >
          <span className="sr-only">Toggle policy</span>
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-150 ease-in-out',
              policy.enabled ? 'translate-x-2' : '-translate-x-2'
            )}
          />
        </button>
      </div>
      
      <p className="text-xs text-zinc-500 mt-1 flex-grow">
        {policy.description}
      </p>
      
      <div className="mt-3 font-mono text-lg text-zinc-100">
        {formatPolicyValue(policy)}
      </div>
      
      <div className="mt-4 pt-3 border-t border-[#1e1e24] flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">{policy.type}</span>
        <button
          onClick={() => onEdit && onEdit(policy.id)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
        >
          Edit Policy
        </button>
      </div>
    </div>
  );
};

export default PolicyCard;
