import React from 'react';
import { cn } from '../../lib/utils';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1f] border border-[#2a2a35] rounded-lg p-3 shadow-xl min-w-[120px]">
        {label && <p className="text-xs text-zinc-500 mb-1">{label}</p>}
        <div className="flex flex-col gap-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span className="text-zinc-300 capitalize">{entry.name}:</span>
              <span className="text-zinc-100 font-medium">
                {typeof entry.value === 'number' && entry.value % 1 !== 0 
                  ? entry.value.toFixed(4) 
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default ChartTooltip;
