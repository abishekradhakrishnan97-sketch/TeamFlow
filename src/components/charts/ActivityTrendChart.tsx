import React, { useMemo } from 'react';
import { Card } from '@/components/shared/Card';
import { ActivityEvent, Task } from '@/types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CHART_PALETTE, ChartTooltip } from '@/utils/chartTheme';
import { format, subDays, parseISO, isSameDay } from 'date-fns';

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
    <Card className={`p-6 border-[0.5px] border-black bg-surface flex flex-col justify-between ${className || ''}`}>
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#AFC7E9]/30 border-[0.5px] border-black flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <span>Velocity & Activity Progression (Last 7 Days)</span>
          </h3>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EEE9DD] text-primary border-[0.5px] border-black">
            Past 7 Days
          </span>
        </div>
        <p className="text-xs text-secondary mb-5">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#000000" strokeOpacity={0.08} vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#343434', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#000000', strokeWidth: 0.5 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#77746D', fontSize: 11 }}
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
      <div className="flex items-center justify-between flex-wrap gap-2 pt-4 mt-2 border-t-[0.5px] border-black/15 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.pink.base }} />
          <span className="text-secondary font-medium">Tasks Created:</span>
          <span className="font-bold text-primary">{totalWeeklyCreated}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.green.base }} />
          <span className="text-secondary font-medium">Tasks Completed:</span>
          <span className="font-bold text-primary">{totalWeeklyCompleted}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.blue.base }} />
          <span className="text-secondary font-medium">Operations Events</span>
        </div>
      </div>
    </Card>
  );
};
