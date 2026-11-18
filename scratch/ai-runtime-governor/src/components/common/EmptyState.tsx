import React from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'py-16 flex flex-col items-center gap-3 text-center px-4',
        className
      )}
    >
      {icon && (
        <div className="text-zinc-700 h-10 w-10 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
      {description && (
        <p className="text-xs text-zinc-600 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
