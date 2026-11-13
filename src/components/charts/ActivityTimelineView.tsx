import React, { useState } from 'react';
import { Card } from '@/components/shared/Card';
import { ActivityEvent, Employee, Project } from '@/types';
import { getRelativeTime } from '@/utils/dates';
import {
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Layers,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { CHART_PALETTE } from '@/utils/chartTheme';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';

interface ActivityTimelineViewProps {
  activities: ActivityEvent[];
  employees?: Employee[];
  projects?: Project[];
  className?: string;
}

export const ActivityTimelineView: React.FC<ActivityTimelineViewProps> = ({
  activities,
  employees = [],
  projects = [],
  className,
}) => {
  const { isDark } = useDashboardTheme();
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const getActivityMarker = (desc: string, eventType?: string) => {
    const text = `${desc} ${eventType || ''}`.toLowerCase();

    if (text.includes('completed') || text.includes('delivered')) {
      return {
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#2D3E16]" />,
        bg: CHART_PALETTE.green.base,
        badge: 'Completed',
      };
    }
    if (text.includes('revision') || text.includes('change')) {
      return {
        icon: <RotateCcw className="w-3.5 h-3.5 text-[#731E1E]" />,
        bg: CHART_PALETTE.coral.base,
        badge: 'Revision',
      };
    }
    if (text.includes('review') || text.includes('approval')) {
      return {
        icon: <FileCheck2 className="w-3.5 h-3.5 text-[#4D2875]" />,
        bg: CHART_PALETTE.purple.base,
        badge: 'Review',
      };
    }
    if (text.includes('permission') || text.includes('attendance') || text.includes('early') || text.includes('extra')) {
      return {
        icon: <Clock className="w-3.5 h-3.5 text-[#5C4405]" />,
        bg: CHART_PALETTE.yellow.base,
        badge: 'Attendance',
      };
    }
    if (text.includes('created') || text.includes('new') || text.includes('project')) {
      return {
        icon: <Sparkles className="w-3.5 h-3.5 text-[#1E3A8A]" />,
        bg: CHART_PALETTE.blue.base,
        badge: 'Milestone',
      };
    }
    return {
      icon: <Layers className="w-3.5 h-3.5 text-[#6D1B3E]" />,
      bg: CHART_PALETTE.pink.base,
      badge: 'Task Activity',
    };
  };

  const filtered = activities.filter((act) => {
    if (selectedProjectId !== 'all' && act.project_id !== selectedProjectId) return false;
    if (filterType !== 'all') {
      const marker = getActivityMarker(act.description, act.event_type);
      if (marker.badge.toLowerCase() !== filterType.toLowerCase()) return false;
    }
    return true;
  });

  return (
    <Card
      className={clsx(
        'p-6 border-[0.5px] flex flex-col justify-between',
        isDark ? 'bg-[#1F1F22] border-[#393940] text-[#F5F3EE]' : 'border-black bg-surface',
        className
      )}
    >
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3
              className={clsx(
                'text-base font-bold flex items-center gap-2',
                isDark ? 'text-[#F5F3EE]' : 'text-primary'
              )}
            >
              <div
                className={clsx(
                  'w-7 h-7 rounded-lg border-[0.5px] flex items-center justify-center',
                  isDark ? 'bg-[#AFC7E9]/20 border-[#AFC7E9]/40' : 'bg-[#AFC7E9]/30 border-black'
                )}
              >
                <Sparkles className="w-4 h-4 text-[#AFC7E9]" />
              </div>
              <span>Live Operations Activity Timeline</span>
            </h3>
            <p className={clsx('text-xs mt-0.5', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>
              Audited operational chronology across tasks, reviews, revisions, and permissions
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={clsx(
                'px-2.5 py-1 text-xs border-[0.5px] rounded-lg font-bold focus:outline-none',
                isDark
                  ? 'bg-[#27272B] border-[#393940] text-[#F5F3EE]'
                  : 'bg-[#EEE9DD] border-black text-primary'
              )}
            >
              <option value="all">All Events</option>
              <option value="completed">Completed</option>
              <option value="review">Reviews</option>
              <option value="revision">Revisions</option>
              <option value="attendance">Attendance</option>
              <option value="milestone">Milestones</option>
            </select>

            {projects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={clsx(
                  'px-2.5 py-1 text-xs border-[0.5px] rounded-lg font-bold focus:outline-none max-w-[150px] truncate',
                  isDark
                    ? 'bg-[#27272B] border-[#393940] text-[#F5F3EE]'
                    : 'bg-[#EEE9DD] border-black text-primary'
                )}
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Timeline Items */}
        <div className="space-y-3.5 max-h-[460px] overflow-y-auto scrollbar-thin pr-1 mt-4">
          {filtered.length === 0 ? (
            <div className={clsx('py-12 text-center text-xs italic', isDark ? 'text-[#85838A]' : 'text-secondary')}>
              No matching activity events recorded
            </div>
          ) : (
            filtered.map((act) => {
              const marker = getActivityMarker(act.description, act.event_type);
              const relatedProject = act.project_id
                ? projects.find((p) => p.id === act.project_id)
                : null;

              return (
                <div
                  key={act.id}
                  className={clsx(
                    'p-3 rounded-xl border-[0.5px] transition-all flex items-start gap-3 group',
                    isDark
                      ? 'border-[#393940] bg-[#27272B] hover:bg-[#303036] hover:border-[#4E4E57]'
                      : 'border-black/15 bg-[#FFFDF7] hover:bg-[#EEE9DD]/35'
                  )}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border-[0.5px] border-black/30 shadow-xs"
                    style={{ backgroundColor: marker.bg }}
                  >
                    {marker.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={clsx(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border-[0.5px]',
                          isDark
                            ? 'bg-[#303036] text-[#F5F3EE] border-[#393940]'
                            : 'bg-[#EEE9DD] text-primary border-black/15'
                        )}
                      >
                        {marker.badge}
                      </span>
                      <span className={clsx('text-[10px] font-semibold', isDark ? 'text-[#85838A]' : 'text-secondary')}>
                        {getRelativeTime(act.created_at)}
                      </span>
                    </div>

                    <p
                      className={clsx(
                        'text-xs font-semibold mt-1.5 leading-snug transition-colors',
                        isDark ? 'text-[#F5F3EE] group-hover:text-[#AFC7E9]' : 'text-primary group-hover:text-accent'
                      )}
                    >
                      {act.description}
                    </p>

                    {relatedProject && (
                      <p className={clsx('text-[10px] font-medium mt-1', isDark ? 'text-[#85838A]' : 'text-secondary')}>
                        Project: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{relatedProject.name}</strong>
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
};
