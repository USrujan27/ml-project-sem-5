import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  Play,
  Cpu,
  BarChart3,
  ShieldCheck,
  FlaskConical,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  Circle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Tasks', path: '/tasks', icon: ListTodo },
  { label: 'Executions', path: '/executions', icon: Play },
  { label: 'Models', path: '/models', icon: Cpu },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Policies', path: '/policies', icon: ShieldCheck },
  { label: 'Evaluations', path: '/evaluations', icon: FlaskConical },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#1e1e24] bg-[#0c0c0f] transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-[#1e1e24] px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-400">
          <ShieldCheck className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold text-zinc-100 tracking-tight">
              AI Runtime Governor
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-100',
                isActive
                  ? 'bg-[#ffffff0a] text-zinc-100'
                  : 'text-zinc-500 hover:bg-[#ffffff06] hover:text-zinc-300'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors duration-100',
                  isActive ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400'
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[#1e1e24] px-2 py-3 space-y-2">
        {/* System Status */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-2.5 py-1.5">
            <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
            <span className="text-[11px] text-zinc-600">All systems operational</span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-1.5">
            <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
          </div>
        )}

        {/* User */}
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors hover:bg-[#ffffff06]',
            collapsed ? 'justify-center' : ''
          )}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
            <User className="h-3.5 w-3.5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-medium text-zinc-300">Admin</span>
              <span className="truncate text-[10px] text-zinc-600">admin@runtime.ai</span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-md py-1.5 text-zinc-600 transition-colors hover:bg-[#ffffff06] hover:text-zinc-400"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
