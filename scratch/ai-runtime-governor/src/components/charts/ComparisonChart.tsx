import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import ChartTooltip from '../common/ChartTooltip';
import type { StrategyComparison } from '../../data/types';
import { cn } from '../../lib/utils';

interface ComparisonChartProps {
  data: StrategyComparison[];
  metric: 'totalCost' | 'successRate' | 'averageQuality' | 'averageLatency' | 'costPerSuccess';
  className?: string;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({
  data,
  metric,
  className,
}) => {
  const formatValue = (val: number) => {
    if (metric === 'totalCost' || metric === 'costPerSuccess') return `$${val.toFixed(2)}`;
    if (metric === 'successRate') return `${val}%`;
    if (metric === 'averageLatency') return `${val}ms`;
    return val.toFixed(2);
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e24" horizontal={false} />
          <XAxis
            type="number"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
          />
          <YAxis
            type="category"
            dataKey="strategy"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey={metric} radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.strategy === 'AI Runtime Governor' ? '#6366f1' : '#52525b'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;
