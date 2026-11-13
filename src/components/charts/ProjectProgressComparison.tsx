import React from 'react';
import { Card } from '@/components/shared/Card';
import { Project, Task } from '@/types';
import { FolderKanban, Users, Calendar, ArrowRight } from 'lucide-react';
import { formatDate } from '@/utils/dates';
import { useNavigate } from 'react-router-dom';
import { CHART_PALETTE } from '@/utils/chartTheme';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';

interface ProjectProgressComparisonProps {
  projects: Project[];
  tasks: Task[];
  className?: string;
  limit?: number;
}

export const ProjectProgressComparison: React.FC<ProjectProgressComparisonProps> = ({
  projects,
  tasks,
  className,
  limit = 5,
}) => {
  const navigate = useNavigate();
  const { isDark } = useDashboardTheme();

  // Focus on active and under-review projects first
  const activeProjects = projects
    .filter((p) => p.status === 'active' || p.status === 'under_review' || p.status === 'reopened')
    .slice(0, limit);

  return (
    <Card
      className={clsx(
        'p-6 border-[0.5px] flex flex-col justify-between',
        isDark ? 'bg-[#1F1F22] border-[#393940] text-[#F5F3EE]' : 'border-black bg-surface',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-1">
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
              <FolderKanban className="w-4 h-4 text-[#AFC7E9]" />
            </div>
            <span>Active Project Velocity & Completion</span>
          </h3>
          <button
            onClick={() => navigate('/projects')}
            className={clsx(
              'text-xs font-bold hover:underline inline-flex items-center gap-1',
              isDark ? 'text-[#AFC7E9]' : 'text-primary'
            )}
          >
            <span>All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className={clsx('text-xs mb-5', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>
          Real-time deliverable progress and work distribution across active client projects
        </p>

        {activeProjects.length === 0 ? (
          <div className={clsx('py-10 text-center text-xs italic', isDark ? 'text-[#85838A]' : 'text-secondary')}>
            No active projects currently in flight
          </div>
        ) : (
          <div className="space-y-4">
            {activeProjects.map((project) => {
              const projectTasks = tasks.filter((t) => t.project_id === project.id);
              const totalTasks = projectTasks.length;
              const completedTasks = projectTasks.filter((t) => t.status === 'completed').length;
              const workingTasks = projectTasks.filter((t) => t.status === 'working').length;
              const reviewTasks = projectTasks.filter(
                (t) => t.status === 'ready_for_review' || t.status === 'changes_requested'
              ).length;
              const blockedTasks = projectTasks.filter((t) => t.status === 'blocked').length;

              const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              const workingPct = totalTasks > 0 ? Math.round((workingTasks / totalTasks) * 100) : 0;
              const reviewPct = totalTasks > 0 ? Math.round((reviewTasks / totalTasks) * 100) : 0;
              const blockedPct = totalTasks > 0 ? Math.round((blockedTasks / totalTasks) * 100) : 0;

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className={clsx(
                    'p-3.5 rounded-xl border-[0.5px] transition-all cursor-pointer group shadow-xs space-y-2.5',
                    isDark
                      ? 'border-[#393940] bg-[#27272B] hover:bg-[#303036] hover:border-[#4E4E57]'
                      : 'border-black/20 bg-[#FFFDF7] hover:bg-[#EEE9DD]/35'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'font-bold text-xs truncate transition-colors',
                            isDark ? 'text-[#F5F3EE] group-hover:text-[#AFC7E9]' : 'text-primary group-hover:text-accent'
                          )}
                        >
                          {project.name}
                        </span>
                        {project.client_name && (
                          <span
                            className={clsx(
                              'text-[10px] px-2 py-0.5 rounded-full font-medium border-[0.5px] truncate max-w-[120px]',
                              isDark
                                ? 'bg-[#303036] text-[#B5B2AD] border-[#393940]'
                                : 'bg-[#EEE9DD] text-secondary border-black/15'
                            )}
                          >
                            {project.client_name}
                          </span>
                        )}
                      </div>
                      <div className={clsx('flex items-center gap-3 text-[11px] mt-1', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>
                        {project.target_delivery_date && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Target: {formatDate(project.target_delivery_date)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {project.members?.length || 1} assigned
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={clsx('text-sm font-black', isDark ? 'text-[#F5F3EE]' : 'text-primary')}>{percent}%</span>
                      <span className={clsx('block text-[10px] font-medium', isDark ? 'text-[#85838A]' : 'text-secondary')}>
                        {completedTasks}/{totalTasks} tasks
                      </span>
                    </div>
                  </div>

                  {/* Segmented Colorful Progress Bar */}
                  <div
                    className={clsx(
                      'w-full h-2.5 rounded-full overflow-hidden flex border-[0.5px]',
                      isDark ? 'bg-[#101010] border-[#393940]' : 'bg-[#EEE9DD] border-black/20'
                    )}
                  >
                    {/* Completed: Green */}
                    {percent > 0 && (
                      <div
                        style={{ width: `${percent}%`, backgroundColor: CHART_PALETTE.green.base }}
                        title={`Completed: ${completedTasks}`}
                        className="h-full transition-all duration-500"
                      />
                    )}
                    {/* Working: Pink */}
                    {workingPct > 0 && (
                      <div
                        style={{ width: `${workingPct}%`, backgroundColor: CHART_PALETTE.pink.base }}
                        title={`In Progress: ${workingTasks}`}
                        className="h-full transition-all duration-500"
                      />
                    )}
                    {/* Review: Purple */}
                    {reviewPct > 0 && (
                      <div
                        style={{ width: `${reviewPct}%`, backgroundColor: CHART_PALETTE.purple.base }}
                        title={`In Review: ${reviewTasks}`}
                        className="h-full transition-all duration-500"
                      />
                    )}
                    {/* Blocked: Coral */}
                    {blockedPct > 0 && (
                      <div
                        style={{ width: `${blockedPct}%`, backgroundColor: CHART_PALETTE.coral.base }}
                        title={`Blocked: ${blockedTasks}`}
                        className="h-full transition-all duration-500"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Micro Legend */}
      <div
        className={clsx(
          'flex items-center justify-between flex-wrap gap-2 pt-4 mt-2 border-t-[0.5px] text-[11px]',
          isDark ? 'border-[#393940]' : 'border-black/15'
        )}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.green.base }} />
          <span className={clsx('font-medium', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.pink.base }} />
          <span className={clsx('font-medium', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>Working</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.purple.base }} />
          <span className={clsx('font-medium', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>Review</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.coral.base }} />
          <span className={clsx('font-medium', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>Blocked</span>
        </div>
      </div>
    </Card>
  );
};

