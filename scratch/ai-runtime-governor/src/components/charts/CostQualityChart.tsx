import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Model } from '../../data/types';
import { cn } from '../../lib/utils';
import ChartTooltip from '../common/ChartTooltip';

interface CostQualityChartProps {
  models: Model[];
  className?: string;
}

const CostQualityChart: React.FC<CostQualityChartProps> = ({ models, className }) => {
  const chartData = models.map((m) => ({
    id: m.id,
    name: m.name,
    tier: m.tier,
    cost: m.inputCostPer1k + m.outputCostPer1k,
    quality: m.qualityScore,
    calls: m.totalCalls,
  }));

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'small':
        return '#38bdf8'; // sky-400
      case 'medium':
        return '#8b5cf6'; // violet-400
      case 'large':
        return '#f59e0b'; // amber-400
      default:
        return '#a1a1aa'; // zinc-400
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e24" />
          <XAxis
            type="number"
            dataKey="cost"
            name="Cost per 1k (In+Out)"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `$${val.toFixed(2)}`}
          />
          <YAxis
            type="number"
            dataKey="quality"
            name="Quality Score"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            content={<ChartTooltip />} 
          />
          <Scatter name="Models" data={chartData} fill="#8884d8">
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getTierColor(entry.tier)} 
                r={Math.max(4, Math.min(12, entry.calls / 1000))}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CostQualityChart;
