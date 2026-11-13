import React, { useMemo } from 'react';
import { Card } from '@/components/shared/Card';
import { Task } from '@/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { CheckSquare, AlertTriangle, Clock } from 'lucide-react';
import { CHART_PALETTE, ChartTooltip } from '@/utils/chartTheme';
import { todayIST } from '@/utils/dates';

interface TaskAnalyticsCardProps {
  tasks: Task[];
  className?: string;
}

export const TaskAnalyticsCard: React.FC<TaskAnalyticsCardProps> = ({ tasks, className }) => {
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
      { name: 'No Due Date', count: noDueCount, fill: CHART_PALETTE.charcoal.light },
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
  }, [tasks, today]);

  return (
    <Card className={`p-6 border-[0.5px] border-black bg-surface flex flex-col justify-between ${className || ''}`}>
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#A9BB78]/30 border-[0.5px] border-black flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-[#2D3E16]" />
            </div>
            <span>Task Health & Deadline Adherence</span>
          </h3>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EEE9DD] text-primary border-[0.5px] border-black">
            {tasks.length} Total
          </span>
        </div>
        <p className="text-xs text-secondary mb-4">
          Tracking overdue tasks against on-schedule deliverables and priority urgency
        </p>

        {/* Overdue vs On-Time Quick Comparison Pills */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-[#FCF1EF] border-[0.5px] border-black/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#CE7864] block">
                Overdue Tasks
              </span>
              <span className="text-2xl font-black text-[#CE7864] leading-tight">
                {analytics.overdueCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#E99A88]/30 flex items-center justify-center border-[0.5px] border-black/20">
              <AlertTriangle className="w-4 h-4 text-[#CE7864]" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F2F7EC] border-[0.5px] border-black/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A8E45] block">
                On Schedule
              </span>
              <span className="text-2xl font-black text-[#7A8E45] leading-tight">
                {analytics.onTimeCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#A9BB78]/30 flex items-center justify-center border-[0.5px] border-black/20">
              <Clock className="w-4 h-4 text-[#7A8E45]" />
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
                tick={{ fill: '#343434', fontSize: 11, fontWeight: 600 }}
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
                    stroke="#000000"
                    strokeWidth={0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Urgency Strip */}
      <div className="pt-4 border-t-[0.5px] border-black/15 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
            Active Priority Distribution
          </span>
          <span className="text-[11px] font-bold text-primary">
            {analytics.urgent + analytics.high + analytics.medium + analytics.low} Active
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-1.5 rounded-lg bg-[#FCF1EF] border-[0.5px] border-black/15">
            <span className="block text-[10px] font-semibold text-secondary">Urgent</span>
            <span className="text-xs font-black text-[#CE7864]">{analytics.urgent}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-[#FDF1F7] border-[0.5px] border-black/15">
            <span className="block text-[10px] font-semibold text-secondary">High</span>
            <span className="text-xs font-black text-[#D688AB]">{analytics.high}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-[#FEF9E7] border-[0.5px] border-black/15">
            <span className="block text-[10px] font-semibold text-secondary">Medium</span>
            <span className="text-xs font-black text-[#D8BC44]">{analytics.medium}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-[#F1F6FC] border-[0.5px] border-black/15">
            <span className="block text-[10px] font-semibold text-secondary">Low</span>
            <span className="text-xs font-black text-[#8AAFD8]">{analytics.low}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

