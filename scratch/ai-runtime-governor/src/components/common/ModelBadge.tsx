import React from 'react';
import { cn, getModelColor } from '../../lib/utils';

interface ModelBadgeProps {
  tier: string;
  className?: string;
}

const ModelBadge: React.FC<ModelBadgeProps> = ({ tier, className }) => {
  const colorClass = getModelColor(tier);

  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md border font-mono',
        colorClass,
        className
      )}
    >
      {tier}
    </span>
  );
};

export default ModelBadge;
