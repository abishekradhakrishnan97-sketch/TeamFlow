import React, { useMemo } from 'react';
import { Card } from '@/components/shared/Card';
import { Task } from '@/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { CheckSquare, AlertTriangle, Clock } from 'lucide-react';
import { CHART_PALETTE, ChartTooltip } from '@/utils/chartTheme';
import { todayIST } from '@/utils/dates';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';

interface TaskAnalyticsCardProps {
  tasks: Task[];
  className?: string;
}

export const TaskAnalyticsCard: React.FC<TaskAnalyticsCardProps> = ({ tasks, className }) => {
  const { isDark } = useDashboardTheme();
  const today = todayIST();

  const analytics = useMemo(() => {
    let overdueCount = 0;
    let onTimeCount = 0;
    let completedCount = 0;
    let noDueCount = 0;

    tasks.forEach((t) => {
      if (t.status === 'completed') {
        completedCount++;
      } else if (t.due_date) {
        if (t.due_date < today) {
          overdueCount++;
        } else {
          onTimeCount++;
        }
      } else {
        noDueCount++;
      }
    });

    // Priority breakdown
    const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;
    const high = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;
    const medium = tasks.filter((t) => t.priority === 'medium' && t.status !== 'completed').length;
    const low = tasks.filter((t) => t.priority === 'low' && t.status !== 'completed').length;

    // Delivery pipeline data
    const statusData = [
      { name: 'On Schedule', count: onTimeCount, fill: CHART_PALETTE.green.base },
      { name: 'Overdue', count: overdueCount, fill: CHART_PALETTE.coral.base },
      { name: 'Completed', count: completedCount, fill: CHART_PALETTE.blue.base },
      { name: 'No Due Date', count: noDueCount, fill: isDark ? '#303036' : CHART_PALETTE.charcoal.light },
    ];

    return {
      overdueCount,
      onTimeCount,
      completedCount,
      noDueCount,
      urgent,
      high,
      medium,
      low,
      statusData,
    };
  }, [tasks, today, isDark]);

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
                isDark ? 'bg-[#A9BB78]/20 border-[#A9BB78]/40' : 'bg-[#A9BB78]/30 border-black'
              )}
            >
              <CheckSquare className="w-4 h-4 text-[#A9BB78]" />
            </div>
            <span>Task Health & Deadline Adherence</span>
          </h3>
          <span
            className={clsx(
              'text-xs font-bold px-2.5 py-1 rounded-full border-[0.5px]',
              isDark
                ? 'bg-[#27272B] border-[#393940] text-[#F5F3EE]'
                : 'bg-[#EEE9DD] text-primary border-black'
            )}
          >
            {tasks.length} Total
          </span>
        </div>
        <p className={clsx('text-xs mb-4', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>
          Tracking overdue tasks against on-schedule deliverables and priority urgency
        </p>

        {/* Overdue vs On-Time Quick Comparison Pills */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div
            className={clsx(
              'p-3.5 rounded-xl border-[0.5px] flex items-center justify-between transition-colors',
              isDark ? 'bg-[#E99A88]/15 border-[#E99A88]/30' : 'bg-[#FCF1EF] border-black/20'
            )}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E99A88] block">
                Overdue Tasks
              </span>
              <span className="text-2xl font-black text-[#E99A88] leading-tight">
                {analytics.overdueCount}
              </span>
            </div>
            <div
              className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center border-[0.5px]',
                isDark ? 'bg-[#E99A88]/20 border-[#E99A88]/30' : 'bg-[#E99A88]/30 border-black/20'
              )}
            >
              <AlertTriangle className="w-4 h-4 text-[#E99A88]" />
            </div>
          </div>

          <div
            className={clsx(
              'p-3.5 rounded-xl border-[0.5px] flex items-center justify-between transition-colors',
              isDark ? 'bg-[#A9BB78]/15 border-[#A9BB78]/30' : 'bg-[#F2F7EC] border-black/20'
            )}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A9BB78] block">
                On Schedule
              </span>
              <span className="text-2xl font-black text-[#A9BB78] leading-tight">
                {analytics.onTimeCount}
              </span>
            </div>
            <div
              className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center border-[0.5px]',
                isDark ? 'bg-[#A9BB78]/20 border-[#A9BB78]/30' : 'bg-[#A9BB78]/30 border-black/20'
              )}
            >
              <Clock className="w-4 h-4 text-[#A9BB78]" />
            </div>
          </div>
        </div>

        {/* Horizontal Bar Chart for Status Health */}
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics.statusData}
              layout="vertical"
              margin={{ top: 0, right: 15, left: -20, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: isDark ? '#B5B2AD' : '#343434', fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={95}
              />
              <Tooltip
                content={({ active, payload }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    suffix=" tasks"
                  />
                )}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                {analytics.statusData.map((entry, index) => (
                  <Cell
                    key={`health-bar-${index}`}
                    fill={entry.fill}
                    stroke={isDark ? '#1F1F22' : '#000000'}
                    strokeWidth={0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Urgency Strip */}
      <div
        className={clsx(
          'pt-4 border-t-[0.5px] text-xs',
          isDark ? 'border-[#393940]' : 'border-black/15'
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={clsx('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-[#85838A]' : 'text-secondary')}>
            Active Priority Distribution
          </span>
          <span className={clsx('text-[11px] font-bold', isDark ? 'text-[#F5F3EE]' : 'text-primary')}>
            {analytics.urgent + analytics.high + analytics.medium + analytics.low} Active
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div
            className={clsx(
              'p-1.5 rounded-lg border-[0.5px]',
              isDark ? 'bg-[#27272B] border-[#393940]' : 'bg-[#FCF1EF] border-black/15'
            )}
          >
            <span className={clsx('block text-[10px] font-semibold', isDark ? 'text-[#85838A]' : 'text-secondary')}>Urgent</span>
            <span className="text-xs font-black text-[#E99A88]">{analytics.urgent}</span>
          </div>
          <div
            className={clsx(
              'p-1.5 rounded-lg border-[0.5px]',
              isDark ? 'bg-[#27272B] border-[#393940]' : 'bg-[#FDF1F7] border-black/15'
            )}
          >
            <span className={clsx('block text-[10px] font-semibold', isDark ? 'text-[#85838A]' : 'text-secondary')}>High</span>
            <span className="text-xs font-black text-[#EFAED0]">{analytics.high}</span>
          </div>
          <div
            className={clsx(
              'p-1.5 rounded-lg border-[0.5px]',
              isDark ? 'bg-[#27272B] border-[#393940]' : 'bg-[#FEF9E7] border-black/15'
            )}
          >
            <span className={clsx('block text-[10px] font-semibold', isDark ? 'text-[#85838A]' : 'text-secondary')}>Medium</span>
            <span className="text-xs font-black text-[#F2D76B]">{analytics.medium}</span>
          </div>
          <div
            className={clsx(
              'p-1.5 rounded-lg border-[0.5px]',
              isDark ? 'bg-[#27272B] border-[#393940]' : 'bg-[#F1F6FC] border-black/15'
            )}
          >
            <span className={clsx('block text-[10px] font-semibold', isDark ? 'text-[#85838A]' : 'text-secondary')}>Low</span>
            <span className="text-xs font-black text-[#AFC7E9]">{analytics.low}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

