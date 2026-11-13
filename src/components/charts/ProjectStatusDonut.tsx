import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card } from '@/components/shared/Card';
import { PieChart as PieIcon } from 'lucide-react';
import { Project } from '@/types';
import { CHART_PALETTE, ChartTooltip } from '@/utils/chartTheme';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';

interface ProjectStatusDonutProps {
  projects: Project[];
  className?: string;
}

export const ProjectStatusDonut: React.FC<ProjectStatusDonutProps> = ({ projects, className }) => {
  const { isDark } = useDashboardTheme();

  const statusCounts: Record<string, { name: string; count: number; color: string; fill: string }> = {
    active: { name: 'Active', count: 0, color: CHART_PALETTE.pink.base, fill: CHART_PALETTE.pink.light },
    under_review: { name: 'Under Review', count: 0, color: CHART_PALETTE.purple.base, fill: CHART_PALETTE.purple.light },
    delivered: { name: 'Delivered', count: 0, color: CHART_PALETTE.green.base, fill: CHART_PALETTE.green.light },
    on_hold: { name: 'On Hold', count: 0, color: CHART_PALETTE.yellow.base, fill: CHART_PALETTE.yellow.light },
    reopened: { name: 'Reopened', count: 0, color: CHART_PALETTE.coral.base, fill: CHART_PALETTE.coral.light },
  };

  projects.forEach((p) => {
    if (statusCounts[p.status]) {
      statusCounts[p.status].count++;
    }
  });

  const chartData = Object.values(statusCounts).filter((item) => item.count > 0);
  const totalProjects = projects.length;

  return (
    <Card
      className={clsx(
        'p-6 flex flex-col justify-between border-[0.5px]',
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
                isDark ? 'bg-[#EFAED0]/20 border-[#EFAED0]/40' : 'bg-[#EFAED0]/30 border-black'
              )}
            >
              <PieIcon className="w-4 h-4 text-[#EFAED0]" />
            </div>
            <span>Project Status Portfolio</span>
          </h3>
          <span
            className={clsx(
              'text-xs font-bold px-2.5 py-1 rounded-full border-[0.5px]',
              isDark
                ? 'bg-[#27272B] border-[#393940] text-[#F5F3EE]'
                : 'bg-[#EEE9DD] text-primary border-black'
            )}
          >
            {totalProjects} Total
          </span>
        </div>
        <p className={clsx('text-xs mb-4', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>
          Visual status distribution across active and completed initiatives
        </p>

        <div className="h-56 w-full relative">
          {totalProjects > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={4}
                    dataKey="count"
                    stroke={isDark ? '#1F1F22' : '#000000'}
                    strokeWidth={isDark ? 1 : 0.5}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => (
                      <ChartTooltip
                        active={active}
                        payload={payload}
                        formatter={(val) => `${val} projects (${Math.round((val / totalProjects) * 100)}%)`}
                      />
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Total count in center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className={clsx(
                    'text-2xl font-black leading-none tracking-tight',
                    isDark ? 'text-[#F5F3EE]' : 'text-primary'
                  )}
                >
                  {totalProjects}
                </span>
                <span
                  className={clsx(
                    'text-[10px] font-bold uppercase tracking-wider mt-0.5',
                    isDark ? 'text-[#85838A]' : 'text-secondary'
                  )}
                >
                  Projects
                </span>
              </div>
            </>
          ) : (
            <div className={clsx('h-full flex items-center justify-center text-xs italic', isDark ? 'text-[#85838A]' : 'text-secondary')}>
              No project records to display
            </div>
          )}
        </div>
      </div>

      {/* Legend with counts and percentages */}
      <div
        className={clsx(
          'grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 border-t-[0.5px] text-xs',
          isDark ? 'border-[#393940]' : 'border-black/15'
        )}
      >
        {chartData.map((item, idx) => {
          const pct = totalProjects > 0 ? Math.round((item.count / totalProjects) * 100) : 0;
          return (
            <div
              key={idx}
              className={clsx(
                'flex items-center gap-2 p-1.5 rounded-lg border-[0.5px]',
                isDark ? 'bg-[#27272B] border-[#393940]' : 'bg-[#EEE9DD]/35 border-black/10'
              )}
            >
              <div
                className="w-3 h-3 rounded-md shrink-0 border-[0.5px] border-black/30"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0 flex-1 truncate">
                <span
                  className={clsx(
                    'text-[11px] font-semibold truncate block',
                    isDark ? 'text-[#F5F3EE]' : 'text-primary'
                  )}
                >
                  {item.name}
                </span>
                <span
                  className={clsx(
                    'text-[10px] font-medium',
                    isDark ? 'text-[#B5B2AD]' : 'text-secondary'
                  )}
                >
                  {item.count} ({pct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

