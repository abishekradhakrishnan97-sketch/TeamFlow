import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from '@/services/supabase/auth';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
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
  Zap,
  Bell,
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
  const { isDark } = useDashboardTheme();
  const { unreadCount } = useNotifications();
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const isExpanded = mobileOpen || isHovered;

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
        {
          label: 'Notifications',
          path: '/notifications',
          icon: <Bell className="w-5 h-5 shrink-0" />,
          badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
        },
        { label: 'Projects', path: '/projects', icon: <FolderKanban className="w-5 h-5 shrink-0" /> },
        { label: 'Tasks', path: '/tasks', icon: <CheckSquare className="w-5 h-5 shrink-0" /> },
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={clsx(
          'h-screen flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-40 sticky top-0 border-r-[0.5px] select-none',
          isDark
            ? 'bg-[#171719] text-[#F5F3EE] border-r-[#393940]'
            : 'bg-sidebar text-[#E0DDD5] border-r-black',
          // Desktop collapsed vs expanded on hover
          isExpanded ? 'md:w-64 shadow-2xl' : 'md:w-[72px]',
          // Mobile drawer state
          mobileOpen ? 'fixed left-0 top-0 bottom-0 w-64 shadow-2xl' : 'hidden md:flex'
        )}
      >
        {/* Top Section: Brand & Quick Action */}
        <div className="flex flex-col shrink-0">
          {/* Header */}
          <div
            className={clsx(
              'h-16 flex items-center px-4 border-b-[0.5px] overflow-hidden transition-colors duration-200',
              isDark ? 'border-b-[#393940]' : 'border-b-black'
            )}
          >
            <div className="flex items-center gap-3 min-w-0 w-full">
              <div
                className={clsx(
                  'w-9 h-9 rounded-xl border-[0.5px] flex items-center justify-center font-bold text-sm tracking-wider shadow-xs shrink-0 transition-colors',
                  isDark
                    ? 'bg-[#222226] border-[#393940] text-[#F5F3EE]'
                    : 'bg-[#2A2A2A] border-black text-[#FFFDF7]'
                )}
              >
                TF
              </div>
              <div
                className={clsx(
                  'transition-all duration-300 ease-in-out min-w-0 overflow-hidden whitespace-nowrap',
                  isExpanded ? 'opacity-100 max-w-[170px]' : 'opacity-0 max-w-0 pointer-events-none'
                )}
              >
                <h1 className="font-bold text-sm tracking-tight text-[#FFFDF7] truncate">TEAMFLOW</h1>
                <p
                  className={clsx(
                    'text-[10px] font-semibold tracking-wider uppercase truncate',
                    isDark ? 'text-[#85838A]' : 'text-[#8C887E]'
                  )}
                >
                  Control Centre
                </p>
              </div>
            </div>
          </div>

          {/* Quick Request Dispatcher Button */}
          <div className="p-3">
            <button
              onClick={onOpenQuickRequest}
              title="Create Quick Request"
              aria-label="Create Quick Request"
              className={clsx(
                'w-full flex items-center rounded-xl bg-[#F2D76B] text-[#222222] font-semibold text-xs py-2.5 hover:bg-[#ebd05f] active:scale-[0.98] transition-all shadow-sm border-[0.5px] overflow-hidden',
                isDark ? 'border-[#393940]' : 'border-black',
                isExpanded ? 'justify-start px-3.5 gap-2.5' : 'justify-center px-0'
              )}
            >
              <Zap className="w-4 h-4 fill-[#222222] shrink-0" />
              <span
                className={clsx(
                  'transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden',
                  isExpanded ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0'
                )}
              >
                Quick Request
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <nav className="flex-1 px-2.5 py-2 space-y-4 overflow-y-auto scrollbar-thin overflow-x-hidden">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div
                className={clsx(
                  'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                  isExpanded ? 'opacity-100 max-h-6' : 'opacity-0 max-h-0'
                )}
              >
                <p
                  className={clsx(
                    'px-3 text-[10px] font-bold uppercase tracking-wider',
                    isDark ? 'text-[#85838A]' : 'text-[#66635B]'
                  )}
                >
                  {section.title}
                </p>
              </div>

              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={!isExpanded ? item.label : undefined}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center rounded-xl text-xs font-medium transition-all group relative overflow-hidden',
                      isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5',
                      isActive
                        ? (isDark
                            ? 'bg-[#27272B] text-[#F5F3EE] font-semibold border-[0.5px] border-[#393940] shadow-xs'
                            : 'bg-[#2A2A2A] text-[#FFFDF7] font-semibold border-[0.5px] border-black shadow-xs')
                        : (isDark
                            ? 'text-[#B5B2AD] hover:text-[#F5F3EE] hover:bg-[#222226]'
                            : 'text-[#A09C92] hover:text-[#FFFDF7] hover:bg-[#222222]')
                    )
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span
                    className={clsx(
                      'transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden',
                      isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0'
                    )}
                  >
                    {item.label}
                  </span>

                  {(item as any).badge !== undefined && (
                    <span
                      className={clsx(
                        'ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full border-[0.5px] shrink-0 transition-opacity',
                        isExpanded ? 'opacity-100' : 'opacity-0',
                        'bg-[#E99A88] text-black border-black'
                      )}
                    >
                      {(item as any).badge}
                    </span>
                  )}

                  {/* Tooltip on collapsed state */}
                  {!isExpanded && (
                    <span
                      className={clsx(
                        'absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 border-[0.5px]',
                        isDark
                          ? 'bg-[#27272B] text-[#F5F3EE] border-[#393940]'
                          : 'bg-[#262626] text-[#FFFDF7] border-black'
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom Section: Design Lead User Profile & Sign Out */}
        <div
          className={clsx(
            'p-3 border-t-[0.5px] shrink-0 overflow-hidden transition-colors duration-200',
            isDark ? 'bg-[#121214] border-t-[#393940]' : 'bg-[#141414] border-t-black'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border-[0.5px] transition-colors',
                  isDark
                    ? 'bg-[#EFAED0]/25 text-[#EFAED0] border-[#EFAED0]/40'
                    : 'bg-[#EFAED0] text-[#4A152E] border-black'
                )}
              >
                DL
              </div>
              <div
                className={clsx(
                  'transition-all duration-300 ease-in-out min-w-0 overflow-hidden whitespace-nowrap',
                  isExpanded ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0'
                )}
              >
                <p className="text-xs font-semibold text-[#FFFDF7] truncate">Design Lead</p>
                <p
                  className={clsx(
                    'text-[10px] truncate',
                    isDark ? 'text-[#85838A]' : 'text-[#8C887E]'
                  )}
                >
                  Administrator
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className={clsx(
                'p-1.5 rounded-lg transition-colors shrink-0',
                isDark
                  ? 'text-[#85838A] hover:text-[#EFAED0] hover:bg-[#222226]'
                  : 'text-[#8C887E] hover:text-[#EFAED0] hover:bg-[#262626]',
                !isExpanded && 'hidden'
              )}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
