import React from 'react';
import { Card } from '@/components/shared/Card';
import { AttendanceRecord } from '@/types';
import { AttendanceExtensionSummary } from '@/services/supabase/attendanceExtensions';
import { Clock, Moon, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { CHART_PALETTE, ChartTooltip } from '@/utils/chartTheme';

interface AttendanceAnalyticsCardProps {
  todayAttendance: AttendanceRecord[];
  activeEmployeeCount: number;
  extSummary: AttendanceExtensionSummary;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  className?: string;
}

export const AttendanceAnalyticsCard: React.FC<AttendanceAnalyticsCardProps> = ({
  todayAttendance,
  activeEmployeeCount,
  extSummary,
  selectedMonth,
  onMonthChange,
  className,
}) => {
  const navigate = useNavigate();

  // Attendance breakdown
  const presentCount = todayAttendance.filter(
    (a) => a.status === 'present' || a.status === 'work_from_home'
  ).length;
  const leaveCount = todayAttendance.filter((a) => a.status === 'leave').length;
  const halfDayCount = extSummary.halfDayPermissionsCount || 0;
  const unrecordedCount = Math.max(activeEmployeeCount - todayAttendance.length, 0);

  // Extra hours series
  const extraHoursData = [
    {
      name: 'Late Active',
      hours: Number((extSummary.extendedActiveMinutes / 60).toFixed(1)),
      fill: CHART_PALETTE.blue.base,
    },
    {
      name: 'Late Standby',
      hours: Number((extSummary.extendedStandbyMinutes / 60).toFixed(1)),
      fill: CHART_PALETTE.charcoal.light,
    },
    {
      name: 'Saturday',
      hours: Number((extSummary.saturdayExtraMinutes / 60).toFixed(1)),
      fill: CHART_PALETTE.pink.base,
    },
    {
      name: 'Sunday',
      hours: Number((extSummary.sundayExtraMinutes / 60).toFixed(1)),
      fill: CHART_PALETTE.yellow.base,
    },
  ];

  const totalExtraHours = (
    (extSummary.extendedActiveMinutes +
      extSummary.extendedStandbyMinutes +
      extSummary.saturdayExtraMinutes +
      extSummary.sundayExtraMinutes) /
    60
  ).toFixed(1);

  return (
    <Card className={`p-6 border-[0.5px] border-black bg-surface flex flex-col justify-between ${className || ''}`}>
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#AFC7E9]/30 border-[0.5px] border-black flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <h3 className="text-base font-bold text-primary">Attendance & Extra Hours</h3>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="text-[11px] font-bold px-2 py-1 rounded-lg bg-[#EEE9DD] border-[0.5px] border-black text-primary focus:outline-none"
          />
        </div>
        <p className="text-xs text-secondary mb-4">
          Today's operational presence combined with month-to-date overtime and weekend sessions
        </p>

        {/* Today's Presence Segmented Bar */}
        <div className="p-3.5 rounded-xl bg-[#FFFDF7] border-[0.5px] border-black/20 mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-primary">Today's Presence Register</span>
            <span className="font-extrabold text-primary">
              {presentCount} / {activeEmployeeCount} Present
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#EEE9DD] overflow-hidden flex border-[0.5px] border-black/20">
            {presentCount > 0 && (
              <div
                style={{
                  width: `${(presentCount / activeEmployeeCount) * 100}%`,
                  backgroundColor: CHART_PALETTE.green.base,
                }}
                title={`Present: ${presentCount}`}
                className="h-full"
              />
            )}
            {leaveCount > 0 && (
              <div
                style={{
                  width: `${(leaveCount / activeEmployeeCount) * 100}%`,
                  backgroundColor: CHART_PALETTE.blue.base,
                }}
                title={`On Leave: ${leaveCount}`}
                className="h-full"
              />
            )}
            {halfDayCount > 0 && (
              <div
                style={{
                  width: `${(halfDayCount / activeEmployeeCount) * 100}%`,
                  backgroundColor: CHART_PALETTE.yellow.base,
                }}
                title={`Half-Day: ${halfDayCount}`}
                className="h-full"
              />
            )}
            {unrecordedCount > 0 && (
              <div
                style={{
                  width: `${(unrecordedCount / activeEmployeeCount) * 100}%`,
                  backgroundColor: CHART_PALETTE.coral.base,
                }}
                title={`Unrecorded: ${unrecordedCount}`}
                className="h-full"
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-secondary font-medium pt-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_PALETTE.green.base }} />
              Present: <strong>{presentCount}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_PALETTE.blue.base }} />
              Leave: <strong>{leaveCount}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_PALETTE.yellow.base }} />
              Permissions: <strong>{halfDayCount}</strong>
            </span>
          </div>
        </div>

        {/* Extra Hours Bar Chart */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center justify-between text-xs font-bold text-primary">
            <span className="flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-accent" />
              <span>Overtime & Weekend Work ({selectedMonth})</span>
            </span>
            <span className="text-accent font-extrabold">{totalExtraHours}h total</span>
          </div>
        </div>

        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={extraHoursData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#343434', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#000000', strokeWidth: 0.5 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#77746D', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    suffix=" hours"
                  />
                )}
              />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={26}>
                {extraHoursData.map((entry, index) => (
                  <Cell
                    key={`extra-cell-${index}`}
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

      <div className="flex items-center justify-between pt-4 border-t-[0.5px] border-black/15 text-xs">
        <span className="text-secondary font-medium">
          Authorizations:{' '}
          <strong className="text-primary">{extSummary.pendingApprovalsCount} pending</strong>
        </span>
        <button
          onClick={() => navigate('/attendance')}
          className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
        >
          <span>Attendance Register</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
};
