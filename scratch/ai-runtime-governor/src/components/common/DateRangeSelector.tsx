import React from 'react';
import { cn } from '../../lib/utils';

interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  className?: string;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  options = ['24h', '7d', '30d'],
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-[#111113] border border-[#1e1e24] rounded-md overflow-hidden inline-flex',
        className
      )}
    >
      {options.map((option, index) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors duration-150',
            index > 0 && 'border-l border-[#1e1e24]',
            value === option
              ? 'bg-[#ffffff0a] text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default DateRangeSelector;
