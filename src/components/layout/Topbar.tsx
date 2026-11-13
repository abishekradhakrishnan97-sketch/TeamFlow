import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Zap, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface TopbarProps {
  onOpenQuickRequest: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenQuickRequest }) => {
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
    '/dashboard': 'Dashboard & Team Overview',
    '/projects': 'Projects Management',
    '/tasks': 'Tasks & Kanban Board',
    '/workflow': 'Custom Workflow Engine',
    '/team': 'Team Directory',
    '/attendance': 'Attendance Register',
    '/leave': 'Leave Management',
    '/revisions': 'Revisions & Deliveries',
    '/calendar': 'Operations Calendar',
    '/reports': 'HR Reports & Statements',
    '/report-history': 'Report Documents History',
    '/archive': 'Archived Projects',
    '/backup-restore': 'Cloud Backup & Recovery',
    '/settings': 'System Settings',
  };

  const currentTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/projects/') ? 'Project Details' : 'TeamFlow Control Centre');

  return (
    <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-base font-semibold text-primary">{currentTitle}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Timezone Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-border text-xs text-secondary">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span className="font-medium text-primary">{timeStr}</span>
        </div>

        {/* Security badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-success text-[11px] font-medium border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Private Lead Access</span>
        </div>

        {/* Quick Request action */}
        <Button
          size="sm"
          variant="primary"
          onClick={onOpenQuickRequest}
          icon={<Zap className="w-3.5 h-3.5 fill-white" />}
        >
          Quick Request
        </Button>
      </div>
    </header>
  );
};

