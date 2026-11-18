import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return `₹${value.toFixed(2)}`;
}

export function formatCurrencyCompact(value: number): string {
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}k`;
  }
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatLatency(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`;
  }
  return `${seconds.toFixed(2)}s`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-IN');
}

export function formatTokens(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
      return 'text-emerald-400';
    case 'failed':
    case 'error':
      return 'text-red-400';
    case 'running':
    case 'retrying':
      return 'text-amber-400';
    case 'queued':
    case 'pending':
      return 'text-zinc-400';
    case 'escalated':
      return 'text-violet-400';
    default:
      return 'text-zinc-400';
  }
}

export function getStatusBgColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
      return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
    case 'failed':
    case 'error':
      return 'bg-red-400/10 text-red-400 border-red-400/20';
    case 'running':
    case 'retrying':
      return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
    case 'queued':
    case 'pending':
      return 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20';
    case 'escalated':
      return 'bg-violet-400/10 text-violet-400 border-violet-400/20';
    default:
      return 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20';
  }
}

export function getModelColor(tier: string): string {
  switch (tier.toLowerCase()) {
    case 'small':
      return 'bg-sky-400/10 text-sky-400 border-sky-400/20';
    case 'medium':
      return 'bg-violet-400/10 text-violet-400 border-violet-400/20';
    case 'large':
      return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
    default:
      return 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20';
  }
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'text-emerald-400';
    case 'medium':
      return 'text-amber-400';
    case 'hard':
      return 'text-red-400';
    default:
      return 'text-zinc-400';
  }
}
