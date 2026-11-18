import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import ChartTooltip from '../common/ChartTooltip';
import { cn } from '../../lib/utils';

interface ModelUsageChartProps {
  data: Array<{ model: string; percentage: number; calls: number; cost: number }>;
  className?: string;
}

const COLORS = ['#38bdf8', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e'];

const ModelUsageChart: React.FC<ModelUsageChartProps> = ({ data, className }) => {
  return (
    <div className={cn('w-full flex flex-col items-center', className)}>
      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="percentage"
              nameKey="model"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-zinc-300 font-mono">{entry.model}</span>
            <span className="text-zinc-500">{entry.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelUsageChart;
