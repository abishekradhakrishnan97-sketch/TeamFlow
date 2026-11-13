import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from '@/services/supabase/auth';
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
          'bg-sidebar text-[#E0DDD5] h-screen flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-40 sticky top-0 border-r-[0.5px] border-black select-none',
          // Desktop collapsed vs expanded on hover
          isExpanded ? 'md:w-64 shadow-2xl' : 'md:w-[72px]',
          // Mobile drawer state
          mobileOpen ? 'fixed left-0 top-0 bottom-0 w-64 shadow-2xl' : 'hidden md:flex'
        )}
      >
        {/* Top Section: Brand & Quick Action */}
        <div className="flex flex-col shrink-0">
          {/* Header */}
          <div className="h-16 flex items-center px-4 border-b-[0.5px] border-black overflow-hidden">
            <div className="flex items-center gap-3 min-w-0 w-full">
              <div className="w-9 h-9 rounded-xl bg-[#2A2A2A] border-[0.5px] border-black flex items-center justify-center text-[#FFFDF7] font-bold text-sm tracking-wider shadow-xs shrink-0">
                TF
              </div>
              <div
                className={clsx(
                  'transition-all duration-300 ease-in-out min-w-0 overflow-hidden whitespace-nowrap',
                  isExpanded ? 'opacity-100 max-w-[170px]' : 'opacity-0 max-w-0 pointer-events-none'
                )}
              >
                <h1 className="font-bold text-sm tracking-tight text-[#FFFDF7] truncate">TEAMFLOW</h1>
                <p className="text-[10px] text-[#8C887E] font-semibold tracking-wider uppercase truncate">
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
                'w-full flex items-center rounded-xl bg-[#F2D76B] text-[#222222] font-semibold text-xs py-2.5 hover:bg-[#ebd05f] active:scale-[0.98] transition-all shadow-sm border-[0.5px] border-black overflow-hidden',
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
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#66635B]">
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
                        ? 'bg-[#2A2A2A] text-[#FFFDF7] font-semibold border-[0.5px] border-black shadow-xs'
                        : 'text-[#A09C92] hover:text-[#FFFDF7] hover:bg-[#222222]'
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

                  {/* Tooltip on collapsed state */}
                  {!isExpanded && (
                    <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#262626] text-[#FFFDF7] text-[11px] font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 border-[0.5px] border-black">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom Section: Design Lead User Profile & Sign Out */}
        <div className="p-3 border-t-[0.5px] border-black shrink-0 bg-[#141414] overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#EFAED0] text-[#4A152E] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border-[0.5px] border-black">
                DL
              </div>
              <div
                className={clsx(
                  'transition-all duration-300 ease-in-out min-w-0 overflow-hidden whitespace-nowrap',
                  isExpanded ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0'
                )}
              >
                <p className="text-xs font-semibold text-[#FFFDF7] truncate">Design Lead</p>
                <p className="text-[10px] text-[#8C887E] truncate">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className={clsx(
                'text-[#8C887E] hover:text-[#EFAED0] p-1.5 rounded-lg hover:bg-[#262626] transition-colors shrink-0',
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
