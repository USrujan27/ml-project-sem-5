import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  trend,
  trendLabel,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-[#111113] border border-[#1e1e24] rounded-lg p-4 relative flex flex-col justify-between',
        className
      )}
    >
      {icon && (
        <div className="absolute top-4 right-4 text-zinc-600 h-4 w-4">
          {icon}
        </div>
      )}
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-zinc-50">
          {value}
        </span>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {trend >= 0 ? (
            <TrendingUp className="h-3 w-3 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-400" />
          )}
          <span
            className={cn(
              'text-[11px] font-medium',
              trend >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
          {trendLabel && (
            <span className="text-[11px] text-zinc-500">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
