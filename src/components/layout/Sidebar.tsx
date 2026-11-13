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
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenQuickRequest,
  mobileOpen = false,
  onCloseMobile,
}) => {
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

  const navSections = [
    {
      title: 'Operations',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
        { label: 'Projects', path: '/projects', icon: <FolderKanban className="w-5 h-5 shrink-0" /> },
        { label: 'Tasks', path: '/tasks', icon: <CheckSquare className="w-5 h-5 shrink-0" /> },
        { label: 'Workflow', path: '/workflow', icon: <GitFork className="w-5 h-5 shrink-0" /> },
        { label: 'Team', path: '/team', icon: <Users className="w-5 h-5 shrink-0" /> },
      ],
    },
    {
      title: 'Time & HR',
      items: [
        { label: 'Attendance', path: '/attendance', icon: <Clock className="w-5 h-5 shrink-0" /> },
        { label: 'Leave', path: '/leave', icon: <CalendarDays className="w-5 h-5 shrink-0" /> },
        { label: 'Revisions', path: '/revisions', icon: <History className="w-5 h-5 shrink-0" /> },
        { label: 'Calendar', path: '/calendar', icon: <Calendar className="w-5 h-5 shrink-0" /> },
      ],
    },
    {
      title: 'Governance',
      items: [
        { label: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5 shrink-0" /> },
        { label: 'Report History', path: '/report-history', icon: <FileCheck2 className="w-5 h-5 shrink-0" /> },
        { label: 'Archive', path: '/archive', icon: <Archive className="w-5 h-5 shrink-0" /> },
        { label: 'Backup & Restore', path: '/backup-restore', icon: <Database className="w-5 h-5 shrink-0" /> },
        { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5 shrink-0" /> },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={clsx(
          'bg-sidebar text-[#E0DDD5] h-screen flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-40 sticky top-0 border-r border-[#2A2A2A]',
          // Desktop collapsed vs expanded
          sidebarCollapsed ? 'md:w-[76px]' : 'md:w-64',
          // Mobile drawer state
          mobileOpen ? 'fixed left-0 top-0 bottom-0 w-64' : 'hidden md:flex'
        )}
      >
        {/* Top Section: Brand & Quick Action */}
        <div className="flex flex-col shrink-0">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#262626]">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#2A2A2A] border border-[#3A3A3A] flex items-center justify-center text-[#FFFDF7] font-bold text-sm tracking-wider shadow-xs shrink-0">
                  TF
                </div>
                <div className="min-w-0 flex-1 truncate">
                  <h1 className="font-bold text-sm tracking-tight text-[#FFFDF7] truncate">TEAMFLOW</h1>
                  <p className="text-[10px] text-[#8C887E] font-semibold tracking-wider uppercase truncate">
                    Control Centre
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#2A2A2A] border border-[#3A3A3A] flex items-center justify-center text-[#FFFDF7] font-bold text-sm mx-auto shadow-xs shrink-0">
                TF
              </div>
            )}

            {/* Collapse / Expand Toggle */}
            <button
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="text-[#8C887E] hover:text-[#FFFDF7] p-1.5 rounded-lg hover:bg-[#262626] hidden md:flex items-center justify-center transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Quick Request Dispatcher Button */}
          <div className="p-3">
            <button
              onClick={onOpenQuickRequest}
              title="Create Quick Request"
              aria-label="Create Quick Request"
              className={clsx(
                'w-full flex items-center justify-center gap-2 rounded-xl bg-[#F2D76B] text-[#222222] font-semibold text-xs py-2.5 hover:bg-[#ebd05f] active:scale-[0.98] transition-all shadow-sm',
                sidebarCollapsed ? 'px-0' : 'px-3'
              )}
            >
              <Zap className="w-4 h-4 fill-[#222222] shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Quick Request</span>}
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-thin">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!sidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#66635B]">
                  {section.title}
                </p>
              )}

              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center rounded-xl text-xs font-medium transition-all group relative',
                      sidebarCollapsed
                        ? 'justify-center p-2.5'
                        : 'gap-3 px-3.5 py-2.5',
                      isActive
                        ? 'bg-[#2A2A2A] text-[#FFFDF7] font-semibold border border-[#3A3A3A] shadow-xs'
                        : 'text-[#A09C92] hover:text-[#FFFDF7] hover:bg-[#222222]'
                    )
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}

                  {/* Tooltip on collapsed state */}
                  {sidebarCollapsed && (
                    <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#262626] text-[#FFFDF7] text-[11px] font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 border border-[#3A3A3A]">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom Section: Design Lead User Profile & Sign Out */}
        <div className="p-3 border-t border-[#262626] shrink-0 bg-[#141414]">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#EFAED0] text-[#4A152E] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  DL
                </div>
                <div className="min-w-0 flex-1 truncate">
                  <p className="text-xs font-semibold text-[#FFFDF7] truncate">Design Lead</p>
                  <p className="text-[10px] text-[#8C887E] truncate">Administrator</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                aria-label="Sign Out"
                className="text-[#8C887E] hover:text-[#EFAED0] p-1.5 rounded-lg hover:bg-[#262626] transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="w-full flex items-center justify-center p-2 text-[#8C887E] hover:text-[#EFAED0] rounded-xl hover:bg-[#262626] transition-colors group relative"
            >
              <LogOut className="w-4 h-4" />
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#262626] text-[#FFFDF7] text-[11px] font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 border border-[#3A3A3A]">
                Sign Out
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
