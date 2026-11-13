import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetricCard, Card } from '@/components/shared/Card';
import { StatusBadge, AttendanceBadge, ApprovalBadge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { getProjects } from '@/services/supabase/projects';
import { getEmployees, getDepartments } from '@/services/supabase/employees';
import { getTasks } from '@/services/supabase/tasks';
import { getAttendanceByDate } from '@/services/supabase/attendance';
import { getActivityEvents } from '@/services/supabase/activity';
import {
  getAttendanceExtensionsSummary,
  getAttendancePermissions,
  getEarlyLogoffs,
  getExtendedAvailability,
  getExtraWorkRecords,
  AttendanceExtensionSummary,
} from '@/services/supabase/attendanceExtensions';
import {
  Project,
  Employee,
  Task,
  AttendanceRecord,
  ActivityEvent,
  Department,
  AttendancePermission,
  EarlyLogoff,
  ExtendedAvailability,
  ExtraWorkRecord,
  HALF_DAY_LABELS,
  EXTENDED_ACTIVITY_LABELS,
} from '@/types';
import { todayIST, formatDate, getRelativeTime, getMonthRange } from '@/utils/dates';
import { formatMinutes } from '@/utils/calculations';
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Moon,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  // Attendance Extensions Summary & Recent Exceptions
  const [extSummary, setExtSummary] = useState<AttendanceExtensionSummary>({
    halfDayPermissionsCount: 0,
    halfDayDurationMinutes: 0,
    earlyLogoffsCount: 0,
    earlyLogoffMinutes: 0,
    extendedActiveMinutes: 0,
    extendedStandbyMinutes: 0,
    saturdayExtraMinutes: 0,
    sundayExtraMinutes: 0,
    pendingApprovalsCount: 0,
  });

  const [recentPermissions, setRecentPermissions] = useState<AttendancePermission[]>([]);
  const [recentEarly, setRecentEarly] = useState<EarlyLogoff[]>([]);
  const [recentExtended, setRecentExtended] = useState<ExtendedAvailability[]>([]);
  const [recentExtraWork, setRecentExtraWork] = useState<ExtraWorkRecord[]>([]);

  // Date Filter for Extensions (Defaults to current month)
  const currentMonth = todayIST().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  // Filter state for Team Activity Table
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchEmployee, setSearchEmployee] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = todayIST();
      const { startDate, endDate } = getMonthRange(selectedMonth);

      const [p, e, d, t, att, act, summary, perms, early, ext, extra] = await Promise.all([
        getProjects({ includeArchived: false }),
        getEmployees(true),
        getDepartments(),
        getTasks(),
        getAttendanceByDate(today),
        getActivityEvents({ limit: 12 }),
        getAttendanceExtensionsSummary({ startDate, endDate }),
        getAttendancePermissions({ startDate, endDate }),
        getEarlyLogoffs({ startDate, endDate }),
        getExtendedAvailability({ startDate, endDate }),
        getExtraWorkRecords({ startDate, endDate }),
      ]);

      setProjects(p);
      setEmployees(e);
      setDepartments(d);
      setTasks(t);
      setTodayAttendance(att);
      setActivities(act);
      setExtSummary(summary);
      setRecentPermissions(perms.slice(0, 3));
      setRecentEarly(early.slice(0, 3));
      setRecentExtended(ext.slice(0, 3));
      setRecentExtraWork(extra.slice(0, 3));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics computation
  const activeProjects = projects.filter((p) => p.status === 'active');
  const reopenedProjects = projects.filter((p) => p.status === 'reopened');
  const activeEmployees = employees.filter((e) => e.status === 'active');

  const presentTodayCount = todayAttendance.filter(
    (a) => a.status === 'present' || a.status === 'work_from_home'
  ).length;
  const onLeaveTodayCount = todayAttendance.filter((a) => a.status === 'leave').length;
  const missingAttendanceCount = Math.max(
    0,
    activeEmployees.length - todayAttendance.length
  );

  const inProgressTasks = tasks.filter((t) => t.status === 'working');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const blockedTasks = tasks.filter((t) => t.status === 'blocked');
  const reviewTasks = tasks.filter(
    (t) => t.status === 'ready_for_review' || t.status === 'changes_requested'
  );

  // Filtered employees for activity table
  const filteredEmployees = activeEmployees.filter((emp) => {
    if (filterDepartment !== 'all' && emp.department_id !== filterDepartment) return false;
    if (
      searchEmployee &&
      !emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) &&
      !emp.designation.toLowerCase().includes(searchEmployee.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Row 1: High-level operations */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Active Projects"
          value={activeProjects.length}
          icon={<FolderKanban className="w-5 h-5" />}
          color="accent"
          subtitle={`${projects.length} Total`}
          onClick={() => navigate('/projects')}
        />
        <MetricCard
          label="Team Members"
          value={activeEmployees.length}
          icon={<Users className="w-5 h-5" />}
          color="primary"
          subtitle="All Active"
          onClick={() => navigate('/team')}
        />
        <MetricCard
          label="Present Today"
          value={presentTodayCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
          subtitle="At Office / WFH"
          onClick={() => navigate('/attendance')}
        />
        <MetricCard
          label="On Leave"
          value={onLeaveTodayCount}
          icon={<Calendar className="w-5 h-5" />}
          color="warning"
          subtitle="Approved"
          onClick={() => navigate('/leave')}
        />
        <MetricCard
          label="Unrecorded"
          value={missingAttendanceCount}
          icon={<Clock className="w-5 h-5" />}
          color={missingAttendanceCount > 0 ? 'danger' : 'primary'}
          subtitle="Needs Check-in"
          onClick={() => navigate('/attendance')}
        />
        <MetricCard
          label="Reopened"
          value={reopenedProjects.length}
          icon={<RotateCcw className="w-5 h-5" />}
          color={reopenedProjects.length > 0 ? 'warning' : 'primary'}
          subtitle="Client Revisions"
          onClick={() => navigate('/revisions')}
        />
      </div>

      {/* Metrics Row 2: Attendance Extensions & Extra Work Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
              Attendance & Extra Work Metrics
            </h3>
            <span className="text-[10px] text-accent bg-indigo-50 px-2 py-0.5 rounded font-semibold">
              Month: {selectedMonth}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold px-2 py-1 bg-white border border-border rounded-md text-primary focus:outline-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/attendance')}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <span>Manage Register</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <MetricCard
            label="Half-Day Perms"
            value={extSummary.halfDayPermissionsCount}
            icon={<Clock className="w-4 h-4" />}
            color="warning"
            subtitle={`${formatMinutes(extSummary.halfDayDurationMinutes)} total`}
            onClick={() => navigate('/attendance')}
          />
          <MetricCard
            label="Early Log-Offs"
            value={extSummary.earlyLogoffsCount}
            icon={<AlertTriangle className="w-4 h-4" />}
            color="warning"
            subtitle={`${formatMinutes(extSummary.earlyLogoffMinutes)} early`}
            onClick={() => navigate('/attendance')}
          />
          <MetricCard
            label="Ext. Active Work"
            value={`${(extSummary.extendedActiveMinutes / 60).toFixed(1)}h`}
            icon={<Briefcase className="w-4 h-4" />}
            color="accent"
            subtitle="Post-18:00 Hours"
            onClick={() => navigate('/attendance')}
          />
          <MetricCard
            label="Ext. Standby"
            value={`${(extSummary.extendedStandbyMinutes / 60).toFixed(1)}h`}
            icon={<Moon className="w-4 h-4" />}
            color="primary"
            subtitle="On-Call / Standby"
            onClick={() => navigate('/attendance')}
          />
          <MetricCard
            label="Saturday Work"
            value={`${(extSummary.saturdayExtraMinutes / 60).toFixed(1)}h`}
            icon={<Calendar className="w-4 h-4" />}
            color="accent"
            subtitle="Saturday Sessions"
            onClick={() => navigate('/attendance')}
          />
          <MetricCard
            label="Sunday Work"
            value={`${(extSummary.sundayExtraMinutes / 60).toFixed(1)}h`}
            icon={<Calendar className="w-4 h-4" />}
            color="primary"
            subtitle="Sunday Sessions"
            onClick={() => navigate('/attendance')}
          />
          <MetricCard
            label="Pending Approvals"
            value={extSummary.pendingApprovalsCount}
            icon={<ShieldAlert className="w-4 h-4" />}
            color={extSummary.pendingApprovalsCount > 0 ? 'danger' : 'success'}
            subtitle={extSummary.pendingApprovalsCount > 0 ? 'Requires Action' : 'All Cleared'}
            onClick={() => navigate('/attendance')}
          />
        </div>
      </div>

      {/* Metrics Row 3: Task Workload */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="In Progress"
          value={inProgressTasks.length}
          icon={<Layers className="w-5 h-5" />}
          color="accent"
          subtitle="Active Focus"
          onClick={() => navigate('/tasks')}
        />
        <MetricCard
          label="Awaiting Review"
          value={reviewTasks.length}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
          subtitle="Design / Code Review"
          onClick={() => navigate('/tasks')}
        />
        <MetricCard
          label="Blocked Tasks"
          value={blockedTasks.length}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          subtitle="Requires Attention"
          onClick={() => navigate('/tasks')}
        />
        <MetricCard
          label="Completed"
          value={completedTasks.length}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
          subtitle="All-time Deliverables"
          onClick={() => navigate('/tasks')}
        />
      </div>

      {/* Compact Attendance Exceptions & Extra-Work Summary */}
      {(recentPermissions.length > 0 ||
        recentEarly.length > 0 ||
        recentExtended.length > 0 ||
        recentExtraWork.length > 0) && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                Recent Attendance Exceptions & Weekend Extra Work
              </h3>
              <span className="text-[10px] text-secondary font-medium">
                (Click any record to inspect or authorize in Attendance module)
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/attendance')}
              className="text-xs"
            >
              View Full Register
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Half-Day Permissions Card */}
            <div className="p-3 rounded-lg border border-border bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between font-bold text-primary">
                <span>Half-Day Perms</span>
                <span className="text-[10px] text-accent font-semibold">
                  {recentPermissions.length} recent
                </span>
              </div>
              <div className="space-y-1.5">
                {recentPermissions.length === 0 ? (
                  <p className="text-[11px] text-secondary italic">No permissions logged</p>
                ) : (
                  recentPermissions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate('/attendance')}
                      className="cursor-pointer hover:bg-white p-1 rounded transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary truncate max-w-[110px]">
                          {p.employee?.name}
                        </span>
                        <ApprovalBadge status={p.approval_status} />
                      </div>
                      <div className="text-[10px] text-secondary">
                        {formatDate(p.permission_date)} • {HALF_DAY_LABELS[p.half_day_period]}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Early Log-Offs Card */}
            <div className="p-3 rounded-lg border border-border bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between font-bold text-primary">
                <span>Early Log-Offs</span>
                <span className="text-[10px] text-amber-700 font-semibold">
                  {recentEarly.length} recent
                </span>
              </div>
              <div className="space-y-1.5">
                {recentEarly.length === 0 ? (
                  <p className="text-[11px] text-secondary italic">No early log-offs</p>
                ) : (
                  recentEarly.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => navigate('/attendance')}
                      className="cursor-pointer hover:bg-white p-1 rounded transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary truncate max-w-[110px]">
                          {e.employee?.name}
                        </span>
                        <ApprovalBadge status={e.approval_status} />
                      </div>
                      <div className="text-[10px] text-amber-700 font-medium">
                        {formatDate(e.logoff_date)} • {formatMinutes(e.difference_minutes)} early
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Extended Hours Card */}
            <div className="p-3 rounded-lg border border-border bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between font-bold text-primary">
                <span>Extended Hours</span>
                <span className="text-[10px] text-blue-700 font-semibold">
                  {recentExtended.length} recent
                </span>
              </div>
              <div className="space-y-1.5">
                {recentExtended.length === 0 ? (
                  <p className="text-[11px] text-secondary italic">No extended hours</p>
                ) : (
                  recentExtended.map((x) => (
                    <div
                      key={x.id}
                      onClick={() => navigate('/attendance')}
                      className="cursor-pointer hover:bg-white p-1 rounded transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary truncate max-w-[110px]">
                          {x.employee?.name}
                        </span>
                        <ApprovalBadge status={x.approval_status} />
                      </div>
                      <div className="text-[10px] text-secondary">
                        {formatDate(x.availability_date)} •{' '}
                        {x.active_work_minutes > 0
                          ? `${formatMinutes(x.active_work_minutes)} active`
                          : `${formatMinutes(x.standby_minutes)} standby`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Weekend Work Card */}
            <div className="p-3 rounded-lg border border-border bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between font-bold text-primary">
                <span>Weekend Work</span>
                <span className="text-[10px] text-purple-700 font-semibold">
                  {recentExtraWork.length} recent
                </span>
              </div>
              <div className="space-y-1.5">
                {recentExtraWork.length === 0 ? (
                  <p className="text-[11px] text-secondary italic">No weekend sessions</p>
                ) : (
                  recentExtraWork.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => navigate('/attendance')}
                      className="cursor-pointer hover:bg-white p-1 rounded transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary truncate max-w-[110px]">
                          {w.employee?.name}
                        </span>
                        <ApprovalBadge status={w.approval_status} />
                      </div>
                      <div className="text-[10px] text-purple-700 font-semibold">
                        {w.work_day_type.toUpperCase()} ({formatDate(w.work_date)}) •{' '}
                        {formatMinutes(w.total_minutes)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Grid: Team Activity Table + Live Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Team Activity Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-primary">Team Activity & Current Work</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Current assignments, stages, attendance status and deadlines
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-gray-50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent w-32"
                />

                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-2 py-1 text-xs bg-gray-50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="all">All Depts</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase tracking-wider bg-gray-50/50">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Today</th>
                    <th className="py-2.5 px-3">Current Assignment</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredEmployees.map((emp) => {
                    const empTasks = tasks.filter(
                      (t) =>
                        t.assignees?.some((a) => a.employee?.id === emp.id) &&
                        t.status !== 'completed'
                    );
                    const currentTask = empTasks[0];
                    const attendance = todayAttendance.find((a) => a.employee_id === emp.id);

                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                        onClick={() => navigate(`/team/${emp.id}`)}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-[10px] shrink-0">
                              {emp.initials || emp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-primary">{emp.name}</p>
                              <p className="text-[10px] text-secondary">{emp.designation}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {attendance ? (
                            <AttendanceBadge status={attendance.status} />
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">Unrecorded</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {currentTask ? (
                            <div>
                              <p className="font-medium text-primary truncate max-w-[180px]">
                                {currentTask.title}
                              </p>
                              <p className="text-[10px] text-secondary truncate max-w-[180px]">
                                {currentTask.project?.name || '—'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-secondary italic">No active task</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-[11px] text-secondary">
                            {currentTask?.workflow_stage?.name || '—'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {currentTask ? (
                            <StatusBadge status={currentTask.status} />
                          ) : (
                            <span className="text-secondary">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-[11px] text-secondary">
                            {formatDate(currentTask?.due_date)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredEmployees.length === 0 && (
                <EmptyState
                  icon={<Users className="w-6 h-6" />}
                  title="No team members match filter"
                  description="Try adjusting your department or name filter"
                />
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Chronological Audit Trail & Activity Feed */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">Live Operations Audit</h3>
              <span className="text-[10px] font-semibold text-accent uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                Real-time
              </span>
            </div>

            <div className="space-y-3.5 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-primary font-medium leading-snug">{act.description}</p>
                    <p className="text-[10px] text-secondary mt-0.5">
                      {getRelativeTime(act.created_at)}
                    </p>
                  </div>
                </div>
              ))}

              {activities.length === 0 && (
                <p className="text-xs text-secondary text-center py-6">No recent activity events</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
