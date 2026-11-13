import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Zap, Clock, ShieldCheck, Menu } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';

interface TopbarProps {
  onOpenQuickRequest: () => void;
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenQuickRequest,
  onOpenMobileMenu,
}) => {
  const location = useLocation();
  const { isDark } = useDashboardTheme();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        }) +
          ' • ' +
          now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
          }) +
          ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard & Control Centre',
    '/projects': 'Projects Management',
    '/tasks': 'Tasks & Kanban Workstreams',
    '/team': 'Team Directory',
    '/attendance': 'Attendance & Extra Work Register',
    '/leave': 'Leave Management',
    '/revisions': 'Revisions & Deliveries',
    '/calendar': 'Operations Calendar',
    '/reports': 'HR Statements & PDF Reports',
    '/report-history': 'Report Documents History',
    '/archive': 'Archived Projects',
    '/backup-restore': 'Cloud Backup & Data Recovery',
    '/settings': 'System Settings',
  };

  const currentTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/projects/') ? 'Project Details' : 'TeamFlow Control Centre');

  return (
    <header
      className={clsx(
        'h-16 border-b-[0.5px] px-4 sm:px-6 flex items-center justify-between shrink-0 z-40 relative transition-colors duration-200',
        isDark
          ? 'bg-[#1C1C1F] border-b-[#393940] text-[#F5F3EE] shadow-none'
          : 'bg-[#FFFDF7] border-b-black text-primary shadow-xs'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className={clsx(
            'p-2 -ml-2 rounded-lg md:hidden border-[0.5px] transition-colors',
            isDark
              ? 'text-[#B5B2AD] hover:text-[#F5F3EE] hover:bg-[#27272B] border-[#393940]'
              : 'text-secondary hover:text-primary hover:bg-[#EEE9DD] border-black'
          )}
          title="Open Menu"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2
          className={clsx(
            'text-base sm:text-lg font-bold truncate tracking-tight transition-colors',
            isDark ? 'text-[#F5F3EE]' : 'text-primary'
          )}
        >
          {currentTitle}
        </h2>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Live IST Timezone Pill */}
        <div
          className={clsx(
            'hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border-[0.5px] transition-colors',
            isDark
              ? 'bg-[#27272B] text-[#B5B2AD] border-[#393940]'
              : 'bg-[#EEE9DD] text-secondary border-black'
          )}
        >
          <Clock className={clsx('w-3.5 h-3.5', isDark ? 'text-[#AFC7E9]' : 'text-[#222222]')} />
          <span className={clsx('font-semibold', isDark ? 'text-[#F5F3EE]' : 'text-primary')}>
            {timeStr}
          </span>
        </div>

        {/* Lead Security Indicator */}
        <div
          className={clsx(
            'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border-[0.5px] transition-colors',
            isDark
              ? 'bg-[#A9BB78]/20 text-[#A9BB78] border-[#A9BB78]/40'
              : 'bg-[#A9BB78]/25 text-[#2D4018] border-black'
          )}
        >
          <ShieldCheck className={clsx('w-3.5 h-3.5', isDark ? 'text-[#A9BB78]' : 'text-[#4D6D24]')} />
          <span>Private Lead Session</span>
        </div>

        {/* Quick Request action */}
        <Button
          size="sm"
          variant="primary"
          onClick={onOpenQuickRequest}
          className={clsx(
            'shadow-soft border-[0.5px] transition-colors',
            isDark
              ? 'bg-[#27272B] hover:bg-[#303036] text-[#F5F3EE] border-[#393940]'
              : 'bg-[#222222] hover:bg-[#333333] text-[#FFFDF7] border-black'
          )}
          icon={<Zap className="w-3.5 h-3.5 fill-[#F2D76B] text-[#F2D76B]" />}
        >
          <span className="hidden sm:inline">Quick Request</span>
          <span className="sm:hidden">Request</span>
        </Button>
      </div>
    </header>
  );
};
