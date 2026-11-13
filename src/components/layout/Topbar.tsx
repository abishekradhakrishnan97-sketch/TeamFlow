import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Zap, Clock, ShieldCheck, Menu } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface TopbarProps {
  onOpenQuickRequest: () => void;
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenQuickRequest,
  onOpenMobileMenu,
}) => {
  const location = useLocation();
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
    <header className="h-16 bg-[#FFFDF7] border-b-[0.5px] border-black px-4 sm:px-6 flex items-center justify-between shrink-0 z-40 relative shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-secondary hover:text-primary hover:bg-[#EEE9DD] md:hidden border-[0.5px] border-black"
          title="Open Menu"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-base sm:text-lg font-bold text-primary truncate tracking-tight">
          {currentTitle}
        </h2>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Live IST Timezone Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEE9DD] text-xs text-secondary border-[0.5px] border-black">
          <Clock className="w-3.5 h-3.5 text-[#222222]" />
          <span className="font-semibold text-primary">{timeStr}</span>
        </div>

        {/* Lead Security Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#A9BB78]/25 text-[#2D4018] text-[11px] font-semibold border-[0.5px] border-black">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4D6D24]" />
          <span>Private Lead Session</span>
        </div>

        {/* Quick Request action */}
        <Button
          size="sm"
          variant="primary"
          onClick={onOpenQuickRequest}
          className="bg-[#222222] hover:bg-[#333333] text-[#FFFDF7] shadow-soft border-[0.5px] border-black"
          icon={<Zap className="w-3.5 h-3.5 fill-[#F2D76B] text-[#F2D76B]" />}
        >
          <span className="hidden sm:inline">Quick Request</span>
          <span className="sm:hidden">Request</span>
        </Button>
      </div>
    </header>
  );
};
