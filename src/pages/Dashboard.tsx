import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldCheck,
  Moon,
  Briefcase,
  ChevronRight,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

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
        getActivityEvents({ limit: 10 }),
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
  const activeEmployees = employees.filter((e) => e.status === 'active');

  const presentTodayCount = todayAttendance.filter(
    (a) => a.status === 'present' || a.status === 'work_from_home'
  ).length;
  const onLeaveTodayCount = todayAttendance.filter((a) => a.status === 'leave').length;

  const inProgressTasks = tasks.filter((t) => t.status === 'working');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const blockedTasks = tasks.filter((t) => t.status === 'blocked');
  const reviewTasks = tasks.filter(
    (t) => t.status === 'ready_for_review' || t.status === 'changes_requested'
  );

  // Greeting by hour in IST
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

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

  // Chart Data 1: Project Status Distribution (Donut Chart)
  const projectStatusData = useMemo(() => {
    const counts: Record<string, number> = {
      Active: 0,
      'Under Review': 0,
      'On Hold': 0,
      Delivered: 0,
      Reopened: 0,
    };
    projects.forEach((p) => {
      if (p.status === 'active') counts.Active++;
      else if (p.status === 'under_review') counts['Under Review']++;
      else if (p.status === 'on_hold') counts['On Hold']++;
      else if (p.status === 'delivered') counts.Delivered++;
      else if (p.status === 'reopened') counts.Reopened++;
    });

    return [
      { name: 'Active', value: counts.Active, color: '#AFC7E9' },
      { name: 'Under Review', value: counts['Under Review'], color: '#EFAED0' },
      { name: 'Delivered', value: counts.Delivered, color: '#A9BB78' },
      { name: 'On Hold', value: counts['On Hold'], color: '#F2D76B' },
      { name: 'Reopened', value: counts.Reopened, color: '#C84C4C' },
    ].filter((item) => item.value > 0);
  }, [projects]);

  // Chart Data 2: Task Distribution by Priority & State
  const taskDistributionData = useMemo(() => {
    const notStarted = tasks.filter((t) => t.status === 'not_started').length;
    const working = tasks.filter((t) => t.status === 'working').length;
    const review = tasks.filter(
      (t) => t.status === 'ready_for_review' || t.status === 'changes_requested'
    ).length;
    const blocked = tasks.filter((t) => t.status === 'blocked').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;

    return [
      { stage: 'Not Started', count: notStarted, fill: '#EEE9DD' },
      { stage: 'Working', count: working, fill: '#AFC7E9' },
      { stage: 'In Review', count: review, fill: '#F2D76B' },
      { stage: 'Blocked', count: blocked, fill: '#EFAED0' },
      { stage: 'Completed', count: completed, fill: '#A9BB78' },
    ];
  }, [tasks]);

  // Chart Data 3: Extra Hours Breakdown
  const extraHoursChartData = useMemo(() => {
    return [
      {
        name: 'Late Active',
        hours: Number((extSummary.extendedActiveMinutes / 60).toFixed(1)),
        fill: '#AFC7E9',
      },
      {
        name: 'Late Standby',
        hours: Number((extSummary.extendedStandbyMinutes / 60).toFixed(1)),
        fill: '#EEE9DD',
      },
      {
        name: 'Saturday',
        hours: Number((extSummary.saturdayExtraMinutes / 60).toFixed(1)),
        fill: '#EFAED0',
      },
      {
        name: 'Sunday',
        hours: Number((extSummary.sundayExtraMinutes / 60).toFixed(1)),
        fill: '#F2D76B',
      },
    ];
  }, [extSummary]);

  return (
    <div className="space-y-8">
      {/* 1. WELCOME & OPERATIONAL PULSE BANNER */}
      <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-soft relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#EEE9DD] text-xs font-semibold text-secondary inline-flex items-center gap-1.5 border border-border">
                <Sparkles className="w-3.5 h-3.5 text-[#F2D76B] fill-[#F2D76B]" />
                <span>Executive Operations Centre</span>
              </span>
              <span className="text-xs text-secondary font-medium">
                {formatDate(todayIST())}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              {greeting}, Design Lead.
            </h1>
            <p className="text-sm text-secondary leading-relaxed">
              Here is your live team operational summary. Currently overseeing{' '}
              <strong className="text-primary font-semibold">{activeProjects.length} active projects</strong> with{' '}
              <strong className="text-primary font-semibold">{presentTodayCount} of {activeEmployees.length} members present</strong> today.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/attendance')}
              className="bg-white hover:bg-gray-50 border-border text-primary font-semibold"
              icon={<Clock className="w-4 h-4 text-accent" />}
            >
              Daily Register
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/projects')}
              className="bg-[#222222] hover:bg-[#333333] text-white shadow-soft font-semibold"
              icon={<Plus className="w-4 h-4" />}
            >
              Manage Projects
            </Button>
          </div>
        </div>

        {/* Subtle decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#F2D76B]/15 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-72 h-72 rounded-full bg-[#AFC7E9]/20 blur-3xl pointer-events-none" />
      </div>

      {/* 2. CORE KPI METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          label="Active Projects"
          value={activeProjects.length}
          icon={<FolderKanban className="w-5 h-5" />}
          color="blue"
          subtitle={`${projects.length} Total Registered`}
          onClick={() => navigate('/projects')}
        />
        <MetricCard
          label="Team Present Today"
          value={`${presentTodayCount} / ${activeEmployees.length}`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
          subtitle={`${onLeaveTodayCount} On Approved Leave`}
          onClick={() => navigate('/attendance')}
        />
        <MetricCard
          label="Active Tasks In Progress"
          value={inProgressTasks.length}
          icon={<Layers className="w-5 h-5" />}
          color="pink"
          subtitle={`${reviewTasks.length} Ready for Review`}
          onClick={() => navigate('/tasks')}
        />
        <MetricCard
          label="Pending Approvals"
          value={extSummary.pendingApprovalsCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="yellow"
          subtitle={
            extSummary.pendingApprovalsCount > 0
              ? 'Action Required'
              : 'All Authorizations Clear'
          }
          onClick={() => navigate('/attendance')}
        />
      </div>

      {/* 3. DATA VISUALISATION ROW (RECHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Project Portfolio Distribution (Donut Chart) */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-accent" />
                <span>Project Status Distribution</span>
              </h3>
              <span className="text-xs text-secondary font-medium">
                {projects.length} Total
              </span>
            </div>
            <p className="text-xs text-secondary mb-4">
              Current state across all active client initiatives
            </p>

            <div className="h-52 w-full relative">
              {projectStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFDF7" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-[#171717] text-[#FFFDF7] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md border border-[#333]">
                              {data.name}: {data.value} projects
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-secondary">
                  No active project data to visualize
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border text-xs">
            {projectStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-secondary truncate">{item.name}:</span>
                <span className="font-bold text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Chart 2: Task Workload Distribution by Stage (Horizontal Bars) */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent" />
                <span>Task Workload Pipeline</span>
              </h3>
              <span className="text-xs text-secondary font-medium">
                {tasks.length} Tasks
              </span>
            </div>
            <p className="text-xs text-secondary mb-4">
              Real-time velocity and bottleneck tracking
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskDistributionData} layout="vertical" margin={{ left: -15, right: 15, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tick={{ fill: '#77746D', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={85}
                  />
                  <Tooltip
                    cursor={{ fill: '#EEE9DD', opacity: 0.5 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#171717] text-[#FFFDF7] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md border border-[#333]">
                            {data.stage}: {data.count} tasks
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                    {taskDistributionData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border text-xs">
            <span className="text-secondary font-medium">Blocked: <strong className="text-danger">{blockedTasks.length}</strong></span>
            <span className="text-secondary font-medium">Completed: <strong className="text-success">{completedTasks.length}</strong></span>
          </div>
        </Card>

        {/* Chart 3: Overtime & Weekend Work Breakdown */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                  <Moon className="w-4 h-4 text-accent" />
                  <span>Extra Hours Logged</span>
                </h3>
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#EEE9DD] border border-border text-primary focus:outline-none"
              />
            </div>
            <p className="text-xs text-secondary mb-4">
              Late availability vs weekend sessions ({selectedMonth})
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={extraHoursChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#77746D', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#77746D', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#171717] text-[#FFFDF7] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md border border-[#333]">
                            {data.name}: {data.hours} hours
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={28}>
                    {extraHoursChartData.map((entry, index) => (
                      <Cell key={`cell-extra-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border text-xs">
            <span className="text-secondary">
              Total Extra Work:{' '}
              <strong className="text-primary">
                {(
                  (extSummary.extendedActiveMinutes +
                    extSummary.extendedStandbyMinutes +
                    extSummary.saturdayExtraMinutes +
                    extSummary.sundayExtraMinutes) /
                  60
                ).toFixed(1)}
                h
              </strong>
            </span>
            <button
              onClick={() => navigate('/attendance')}
              className="text-xs text-accent font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Register</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </div>

      {/* 4. COMPACT ATTENDANCE EXCEPTIONS & WEEKEND WORK SECTION */}
      {(recentPermissions.length > 0 ||
        recentEarly.length > 0 ||
        recentExtended.length > 0 ||
        recentExtraWork.length > 0) && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-primary">
                Recent Attendance Exceptions & Weekend Deliveries
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Overview of recent permissions, early departures, and overtime sessions awaiting or authorized by Lead
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/attendance')}
              className="bg-white hover:bg-gray-50 border-border text-xs font-semibold self-start sm:self-auto"
            >
              Full Register & Approvals
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Half-Day Permissions Card */}
            <div className="p-4 rounded-xl border border-border bg-[#FFFDF7] space-y-2.5">
              <div className="flex items-center justify-between font-bold text-primary">
                <span>Half-Day Perms</span>
                <span className="text-[11px] text-accent font-semibold">
                  {recentPermissions.length} recent
                </span>
              </div>
              <div className="space-y-2">
                {recentPermissions.length === 0 ? (
                  <p className="text-xs text-secondary italic">No permissions logged</p>
                ) : (
                  recentPermissions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate('/attendance')}
                      className="cursor-pointer hover:bg-[#EEE9DD]/50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary truncate max-w-[120px]">
                          {p.employee?.name}
                        </span>
                        <ApprovalBadge status={p.approval_status} />
                      </div>
                      <div className="text-[11px] text-secondary mt-0.5">
                        {formatDate(p.permission_date)} • {HALF_DAY_LABELS[p.half_day_period]}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Early Log-Offs Card */}
            <div className="p-4 rounded-xl border border-border bg-[#FFFDF7] space-y-2.5">
              <div className="flex items-center justify-between font-bold text-primary">
                <span>Early Log-Offs</span>
                <span className="text-[11px] text-[#C68B1A] font-semibold">
                  {recentEarly.length} recent
                </span>
              </div>
              <div className="space-y-2">
                {recentEarly.length === 0 ? (
                  <p className="text-xs text-secondary italic">No early departures</p>
                ) : (
                  recentEarly.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => navigate('/attendance')}
                      className="cursor-pointer hover:bg-[#EEE9DD]/50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary truncate max-w-[120px]">
                          {e.employee?.name}
                        </span>
                        <ApprovalBadge status={e.approval_status} />
                      </div>
                      <div className="text-[11px] text-[#C68B1A] font-medium mt-0.5">
                        {formatDate(e.logoff_date)} • {formatMinutes(e.difference_minutes)} early
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Extended Hours Card */}
            <div className="p-4 rounded-xl border border-border bg-[#FFFDF7] space-y-2.5">
              <div className="flex items-center justify-between font-bold text-primary">
                <span>Extended Hours</span>
                <span className="text-[11px] text-[#1E3A8A] font-semibold">
                  {recentExtended.length} recent
                </span>
              </div>
              <div className="space-y-2">
                {recentExtended.length === 0 ? (
                  <p className="text-xs text-secondary italic">No extended hours</p>
                ) : (
                  recentExtended.map((x) => (
                    <div
                      key={x.id}
                      onClick={() => navigate('/attendance')}
                      className="cursor-pointer hover:bg-[#EEE9DD]/50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary truncate max-w-[120px]">
                          {x.employee?.name}
                        </span>
                        <ApprovalBadge status={x.approval_status} />
                      </div>
                      <div className="text-[11px] text-secondary mt-0.5">
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
            <div className="p-4 rounded-xl border border-border bg-[#FFFDF7] space-y-2.5">
              <div className="flex items-center justify-between font-bold text-primary">
                <span>Weekend Sessions</span>
                <span className="text-[11px] text-[#782046] font-semibold">
                  {recentExtraWork.length} recent
                </span>
              </div>
              <div className="space-y-2">
                {recentExtraWork.length === 0 ? (
                  <p className="text-xs text-secondary italic">No weekend sessions</p>
                ) : (
                  recentExtraWork.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => navigate('/attendance')}
                      className="cursor-pointer hover:bg-[#EEE9DD]/50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary truncate max-w-[120px]">
                          {w.employee?.name}
                        </span>
                        <ApprovalBadge status={w.approval_status} />
                      </div>
                      <div className="text-[11px] text-[#782046] font-semibold mt-0.5">
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

      {/* 5. MAIN SECTION: TEAM ACTIVITY TABLE + OPERATIONS AUDIT FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Team Activity & Workload Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-primary">Team Activity & Workload</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Current assignments, stage progression, attendance and deadlines
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#EEE9DD] border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary w-36 text-primary"
                />

                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#EEE9DD] border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-primary"
                >
                  <option value="all">All Departments</option>
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
                  <tr className="border-b border-border text-[11px] font-bold text-secondary uppercase tracking-wider bg-[#EEE9DD]/40">
                    <th className="py-3 px-3.5">Employee</th>
                    <th className="py-3 px-3.5">Today's Presence</th>
                    <th className="py-3 px-3.5">Current Deliverable</th>
                    <th className="py-3 px-3.5">Workflow Stage</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5">Due Date</th>
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
                        className="hover:bg-[#EEE9DD]/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/team/${emp.id}`)}
                      >
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EFAED0]/30 text-[#782046] font-bold flex items-center justify-center text-xs shrink-0 border border-[#EFAED0]/60">
                              {emp.initials || emp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-primary truncate max-w-[140px]">{emp.name}</p>
                              <p className="text-[10px] text-secondary truncate max-w-[140px]">{emp.designation}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          {attendance ? (
                            <AttendanceBadge status={attendance.status} />
                          ) : (
                            <span className="text-[11px] text-secondary italic">Unrecorded</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5">
                          {currentTask ? (
                            <div className="min-w-0">
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

                        <td className="py-3.5 px-3.5">
                          <span className="text-[11px] text-secondary font-medium">
                            {currentTask?.workflow_stage?.name || '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          {currentTask ? (
                            <StatusBadge status={currentTask.status} />
                          ) : (
                            <span className="text-secondary">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <span className="text-[11px] text-secondary font-medium">
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

        {/* Right 1 Col: Chronological Operations Audit Log */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-primary">Live Operations Audit</h3>
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider bg-[#AFC7E9]/30 px-2.5 py-1 rounded-full border border-[#AFC7E9]/50">
                Real-time
              </span>
            </div>

            <div className="space-y-4 max-h-[560px] overflow-y-auto scrollbar-thin pr-1">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-primary font-medium leading-snug">{act.description}</p>
                    <p className="text-[10px] text-secondary mt-0.5">
                      {getRelativeTime(act.created_at)}
                    </p>
                  </div>
                </div>
              ))}

              {activities.length === 0 && (
                <p className="text-xs text-secondary text-center py-8">No recent activity events</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
