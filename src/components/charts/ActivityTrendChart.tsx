import React, { useMemo } from 'react';
import { Card } from '@/components/shared/Card';
import { ActivityEvent, Task } from '@/types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CHART_PALETTE, ChartTooltip } from '@/utils/chartTheme';
import { format, subDays, parseISO, isSameDay } from 'date-fns';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';

interface ActivityTrendChartProps {
  activities: ActivityEvent[];
  tasks: Task[];
  className?: string;
}

export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({
  activities,
  tasks,
  className,
}) => {
  const { isDark } = useDashboardTheme();

  // Generate daily points for the past 7 days
  const trendData = useMemo(() => {
    const points = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayLabel = format(date, 'EEE, d MMM');
      const shortDay = format(date, 'EEE');

      // Count tasks created on this day
      const tasksCreated = tasks.filter((t) => {
        try {
          return t.created_at && isSameDay(parseISO(t.created_at), date);
        } catch {
          return false;
        }
      }).length;

      // Count tasks completed or in review
      const tasksCompleted = tasks.filter((t) => {
        try {
          return (
            t.status === 'completed' &&
            t.created_at &&
            isSameDay(parseISO(t.created_at), date)
          );
        } catch {
          return false;
        }
      }).length;

      // Count activity events on this day
      const eventsCount = activities.filter((a) => {
        try {
          return a.created_at && isSameDay(parseISO(a.created_at), date);
        } catch {
          return false;
        }
      }).length;

      points.push({
        day: shortDay,
        fullDate: dayLabel,
        Created: tasksCreated,
        Completed: tasksCompleted,
        Activities: eventsCount,
      });
    }

    return points;
  }, [activities, tasks]);

  const totalWeeklyCreated = trendData.reduce((acc, p) => acc + p.Created, 0);
  const totalWeeklyCompleted = trendData.reduce((acc, p) => acc + p.Completed, 0);

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
              <TrendingUp className="w-4 h-4 text-[#AFC7E9]" />
            </div>
            <span>Velocity & Activity Progression (Last 7 Days)</span>
          </h3>
          <span
            className={clsx(
              'text-xs font-bold px-2.5 py-1 rounded-full border-[0.5px]',
              isDark
                ? 'bg-[#27272B] border-[#393940] text-[#F5F3EE]'
                : 'bg-[#EEE9DD] text-primary border-black'
            )}
          >
            Past 7 Days
          </span>
        </div>
        <p className={clsx('text-xs mb-5', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>
          Daily comparative velocity between tasks generated, deliverable milestones, and operations events
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_PALETTE.pink.base} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={CHART_PALETTE.pink.base} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_PALETTE.green.base} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={CHART_PALETTE.green.base} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_PALETTE.blue.base} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CHART_PALETTE.blue.base} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#393940' : '#000000'}
                strokeOpacity={isDark ? 0.35 : 0.08}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: isDark ? '#B5B2AD' : '#343434', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: isDark ? '#393940' : '#000000', strokeWidth: 0.5 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: isDark ? '#85838A' : '#77746D', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  const currentPoint = trendData.find((p) => p.day === label);
                  return (
                    <ChartTooltip
                      active={active}
                      payload={payload}
                      label={currentPoint?.fullDate || label}
                      suffix=" items"
                    />
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="Created"
                stroke={CHART_PALETTE.pink.base}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCreated)"
              />
              <Area
                type="monotone"
                dataKey="Completed"
                stroke={CHART_PALETTE.green.base}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCompleted)"
              />
              <Area
                type="monotone"
                dataKey="Activities"
                stroke={CHART_PALETTE.blue.base}
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorActivities)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary stats */}
      <div
        className={clsx(
          'flex items-center justify-between flex-wrap gap-2 pt-4 mt-2 border-t-[0.5px] text-xs',
          isDark ? 'border-[#393940]' : 'border-black/15'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.pink.base }} />
          <span className={clsx('font-medium', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>Tasks Created:</span>
          <span className={clsx('font-bold', isDark ? 'text-[#F5F3EE]' : 'text-primary')}>{totalWeeklyCreated}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.green.base }} />
          <span className={clsx('font-medium', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>Tasks Completed:</span>
          <span className={clsx('font-bold', isDark ? 'text-[#F5F3EE]' : 'text-primary')}>{totalWeeklyCompleted}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.blue.base }} />
          <span className={clsx('font-medium', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>Operations Events</span>
        </div>
      </div>
    </Card>
  );
};

