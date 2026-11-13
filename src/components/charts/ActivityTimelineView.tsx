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
  AlertCircle,
  Filter,
} from 'lucide-react';
import { CHART_PALETTE } from '@/utils/chartTheme';

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
    <Card className={`p-6 border-[0.5px] border-black bg-surface flex flex-col justify-between ${className || ''}`}>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#AFC7E9]/30 border-[0.5px] border-black flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#1E3A8A]" />
              </div>
              <span>Live Operations Activity Timeline</span>
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Audited operational chronology across tasks, reviews, revisions, and permissions
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1 text-xs bg-[#EEE9DD] border-[0.5px] border-black rounded-lg text-primary font-bold focus:outline-none"
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
                className="px-2.5 py-1 text-xs bg-[#EEE9DD] border-[0.5px] border-black rounded-lg text-primary font-bold focus:outline-none max-w-[150px] truncate"
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
            <div className="py-12 text-center text-xs text-secondary italic">
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
                  className="p-3 rounded-xl border-[0.5px] border-black/15 bg-[#FFFDF7] hover:bg-[#EEE9DD]/35 transition-all flex items-start gap-3 group"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border-[0.5px] border-black/30 shadow-xs"
                    style={{ backgroundColor: marker.bg }}
                  >
                    {marker.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EEE9DD] text-primary border-[0.5px] border-black/15">
                        {marker.badge}
                      </span>
                      <span className="text-[10px] font-semibold text-secondary">
                        {getRelativeTime(act.created_at)}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-primary mt-1.5 leading-snug group-hover:text-accent transition-colors">
                      {act.description}
                    </p>

                    {relatedProject && (
                      <p className="text-[10px] font-medium text-secondary mt-1">
                        Project: <strong className="text-primary">{relatedProject.name}</strong>
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
