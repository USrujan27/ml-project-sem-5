import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ChartTooltip from '../common/ChartTooltip';
import { cn } from '../../lib/utils';

interface CostEfficiencyChartProps {
  data: Array<{ label: string; actualCost: number; baselineCost: number }>;
  className?: string;
}

const CostEfficiencyChart: React.FC<CostEfficiencyChartProps> = ({
  data,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#71717a" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e24" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="baselineCost"
            name="Baseline"
            stroke="#71717a"
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorBaseline)"
          />
          <Area
            type="monotone"
            dataKey="actualCost"
            name="Actual Cost"
            stroke="#6366f1"
            fillOpacity={1}
            fill="url(#colorActual)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CostEfficiencyChart;
