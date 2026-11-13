import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { signOut } from '@/services/supabase/auth';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  GitFork,
  Users,
  Clock,
  CalendarDays,
  History,
  Calendar,
  FileText,
  FileCheck2,
  Archive,
  Database,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  onOpenQuickRequest: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenQuickRequest }) => {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Projects', path: '/projects', icon: <FolderKanban className="w-5 h-5" /> },
    { label: 'Tasks', path: '/tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { label: 'Workflow', path: '/workflow', icon: <GitFork className="w-5 h-5" /> },
    { label: 'Team', path: '/team', icon: <Users className="w-5 h-5" /> },
    { label: 'Attendance', path: '/attendance', icon: <Clock className="w-5 h-5" /> },
    { label: 'Leave', path: '/leave', icon: <CalendarDays className="w-5 h-5" /> },
    { label: 'Revisions', path: '/revisions', icon: <History className="w-5 h-5" /> },
    { label: 'Calendar', path: '/calendar', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5" /> },
    { label: 'Report History', path: '/report-history', icon: <FileCheck2 className="w-5 h-5" /> },
    { label: 'Archive', path: '/archive', icon: <Archive className="w-5 h-5" /> },
    { label: 'Backup & Restore', path: '/backup-restore', icon: <Database className="w-5 h-5" /> },
    { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={clsx(
        'bg-sidebar border-r border-border h-screen flex flex-col justify-between shrink-0 transition-all duration-200 z-30 sticky top-0',
        sidebarCollapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-base shadow-sm">
                TF
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-primary">TEAMFLOW</h1>
                <p className="text-[10px] text-secondary font-medium tracking-wide uppercase">
                  Design Lead Centre
                </p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-base mx-auto shadow-sm">
              TF
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="text-secondary hover:text-primary p-1 rounded-md hover:bg-gray-100 hidden md:block"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Quick Request Action Button */}
        <div className="p-3">
          <button
            onClick={onOpenQuickRequest}
            className={clsx(
              'w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 text-accent font-semibold text-xs py-2 hover:bg-indigo-100 transition-colors shadow-sm',
              sidebarCollapsed && 'px-0'
            )}
            title="Create Quick Request"
          >
            <Zap className="w-4 h-4 fill-accent" />
            {!sidebarCollapsed && <span>Quick Request</span>}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-230px)] scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-secondary hover:text-primary hover:bg-gray-50'
                )
              }
            >
              <span className="shrink-0">{item.icon}</span>
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User / Sign Out Footer */}
      <div className="p-3 border-t border-border">
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                DL
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-primary truncate">Design Lead</p>
                <p className="text-[10px] text-secondary truncate">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="text-secondary hover:text-danger p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="w-full flex items-center justify-center p-2 text-secondary hover:text-danger rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

