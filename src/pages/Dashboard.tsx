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
import { todayIST, formatDate, getMonthRange } from '@/utils/dates';
import { formatMinutes } from '@/utils/calculations';
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Plus,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { DashboardThemeToggle } from '@/components/dashboard/DashboardThemeToggle';

// Advanced Visualisation Components
import { CHART_PALETTE } from '@/utils/chartTheme';
import { ProjectStatusDonut } from '@/components/charts/ProjectStatusDonut';
import { ProjectProgressComparison } from '@/components/charts/ProjectProgressComparison';
import { TeamWorkloadBar } from '@/components/charts/TeamWorkloadBar';
import { TaskAnalyticsCard } from '@/components/charts/TaskAnalyticsCard';
import { ActivityTrendChart } from '@/components/charts/ActivityTrendChart';
import { AttendanceAnalyticsCard } from '@/components/charts/AttendanceAnalyticsCard';
import { ActivityTimelineView } from '@/components/charts/ActivityTimelineView';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useDashboardTheme();
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

      const settled = await Promise.allSettled([
        getProjects({ includeArchived: false }),
        getEmployees(true),
        getDepartments(),
        getTasks(),
        getAttendanceByDate(today),
        getActivityEvents({ limit: 20 }),
        getAttendanceExtensionsSummary({ startDate, endDate }),
        getAttendancePermissions({ startDate, endDate }),
        getEarlyLogoffs({ startDate, endDate }),
        getExtendedAvailability({ startDate, endDate }),
        getExtraWorkRecords({ startDate, endDate }),
      ]);

      const [pRes, eRes, dRes, tRes, attRes, actRes, sumRes, permsRes, earlyRes, extRes, extraRes] = settled;

      if (pRes.status === 'fulfilled') setProjects(pRes.value || []);
      if (eRes.status === 'fulfilled') setEmployees(eRes.value || []);
      if (dRes.status === 'fulfilled') setDepartments(dRes.value || []);
      if (tRes.status === 'fulfilled') setTasks(tRes.value || []);
      if (attRes.status === 'fulfilled') setTodayAttendance(attRes.value || []);
      if (actRes.status === 'fulfilled') setActivities(actRes.value || []);
      if (sumRes.status === 'fulfilled') setExtSummary(sumRes.value);
      if (permsRes.status === 'fulfilled') setRecentPermissions((permsRes.value || []).slice(0, 3));
      if (earlyRes.status === 'fulfilled') setRecentEarly((earlyRes.value || []).slice(0, 3));
      if (extRes.status === 'fulfilled') setRecentExtended((extRes.value || []).slice(0, 3));
      if (extraRes.status === 'fulfilled') setRecentExtraWork((extraRes.value || []).slice(0, 3));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics computation
  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'reopened');
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

  // KPI Micro-Visualisation 1: Active Projects Status Bar
  const projectsMicroVisual = useMemo(() => {
    const total = projects.length;
    if (total === 0) return null;
    const active = projects.filter((p) => p.status === 'active').length;
    const review = projects.filter((p) => p.status === 'under_review').length;
    const delivered = projects.filter((p) => p.status === 'delivered').length;
    const hold = projects.filter((p) => p.status === 'on_hold').length;

    return (
      <div className="space-y-1.5">
        <div
          className={clsx(
            'w-full h-1.5 rounded-full overflow-hidden flex border-[0.5px]',
            isDark ? 'bg-[#101010] border-[#393940]' : 'bg-[#EEE9DD] border-black/15'
          )}
        >
          <div style={{ width: `${(active / total) * 100}%`, backgroundColor: CHART_PALETTE.pink.base }} />
          <div style={{ width: `${(review / total) * 100}%`, backgroundColor: CHART_PALETTE.purple.base }} />
          <div style={{ width: `${(delivered / total) * 100}%`, backgroundColor: CHART_PALETTE.green.base }} />
          <div style={{ width: `${(hold / total) * 100}%`, backgroundColor: CHART_PALETTE.yellow.base }} />
        </div>
        <div
          className={clsx(
            'flex items-center justify-between text-[10px] font-medium',
            isDark ? 'text-[#B5B2AD]' : 'text-secondary'
          )}
        >
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.pink.base }} />
            Active: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{active}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.purple.base }} />
            Review: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{review}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.green.base }} />
            Delivered: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{delivered}</strong>
          </span>
        </div>
      </div>
    );
  }, [projects, isDark]);

  // KPI Micro-Visualisation 2: Attendance Distribution Bar
  const attendanceMicroVisual = useMemo(() => {
    const total = activeEmployees.length;
    if (total === 0) return null;
    const present = presentTodayCount;
    const leave = onLeaveTodayCount;
    const unrecorded = Math.max(total - todayAttendance.length, 0);

    return (
      <div className="space-y-1.5">
        <div
          className={clsx(
            'w-full h-1.5 rounded-full overflow-hidden flex border-[0.5px]',
            isDark ? 'bg-[#101010] border-[#393940]' : 'bg-[#EEE9DD] border-black/15'
          )}
        >
          <div style={{ width: `${(present / total) * 100}%`, backgroundColor: CHART_PALETTE.green.base }} />
          <div style={{ width: `${(leave / total) * 100}%`, backgroundColor: CHART_PALETTE.blue.base }} />
          <div style={{ width: `${(unrecorded / total) * 100}%`, backgroundColor: CHART_PALETTE.coral.base }} />
        </div>
        <div
          className={clsx(
            'flex items-center justify-between text-[10px] font-medium',
            isDark ? 'text-[#B5B2AD]' : 'text-secondary'
          )}
        >
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.green.base }} />
            Present: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{present}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.blue.base }} />
            Leave: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{leave}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.coral.base }} />
            Unrecorded: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{unrecorded}</strong>
          </span>
        </div>
      </div>
    );
  }, [activeEmployees, presentTodayCount, onLeaveTodayCount, todayAttendance, isDark]);

  // KPI Micro-Visualisation 3: Tasks Pipeline Bar
  const tasksMicroVisual = useMemo(() => {
    const total = tasks.length;
    if (total === 0) return null;
    const working = inProgressTasks.length;
    const review = reviewTasks.length;
    const completed = completedTasks.length;
    const blocked = blockedTasks.length;

    return (
      <div className="space-y-1.5">
        <div
          className={clsx(
            'w-full h-1.5 rounded-full overflow-hidden flex border-[0.5px]',
            isDark ? 'bg-[#101010] border-[#393940]' : 'bg-[#EEE9DD] border-black/15'
          )}
        >
          <div style={{ width: `${(working / total) * 100}%`, backgroundColor: CHART_PALETTE.pink.base }} />
          <div style={{ width: `${(review / total) * 100}%`, backgroundColor: CHART_PALETTE.purple.base }} />
          <div style={{ width: `${(completed / total) * 100}%`, backgroundColor: CHART_PALETTE.green.base }} />
          <div style={{ width: `${(blocked / total) * 100}%`, backgroundColor: CHART_PALETTE.coral.base }} />
        </div>
        <div
          className={clsx(
            'flex items-center justify-between text-[10px] font-medium',
            isDark ? 'text-[#B5B2AD]' : 'text-secondary'
          )}
        >
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.pink.base }} />
            Working: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{working}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.purple.base }} />
            Review: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{review}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.green.base }} />
            Done: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{completed}</strong>
          </span>
        </div>
      </div>
    );
  }, [tasks, inProgressTasks, reviewTasks, completedTasks, blockedTasks, isDark]);

  // KPI Micro-Visualisation 4: Approvals & Authorizations Strip
  const approvalsMicroVisual = useMemo(() => {
    return (
      <div
        className={clsx(
          'flex items-center justify-between text-[10px] font-medium',
          isDark ? 'text-[#B5B2AD]' : 'text-secondary'
        )}
      >
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.yellow.base }} />
          Perms: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{extSummary.halfDayPermissionsCount || 0}</strong>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.blue.base }} />
          Late Hrs: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{recentExtended.length}</strong>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.coral.base }} />
          Early: <strong className={isDark ? 'text-[#F5F3EE]' : 'text-primary'}>{extSummary.earlyLogoffsCount || 0}</strong>
        </span>
      </div>
    );
  }, [extSummary, recentExtended, isDark]);

  return (
    <div className="space-y-8">
      {/* 1. EXECUTIVE OPERATIONAL PULSE BANNER */}
        <div
          className={clsx(
            'rounded-3xl border-[0.5px] p-6 sm:p-8 relative overflow-hidden transition-all duration-200',
            isDark
              ? 'bg-[#1F1F22] border-[#393940] text-[#F5F3EE]'
              : 'bg-surface border-black shadow-soft text-primary'
          )}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border-[0.5px]',
                    isDark
                      ? 'bg-[#27272B] text-[#F5F3EE] border-[#393940]'
                      : 'bg-[#EEE9DD] text-primary border-black'
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C68B1A] fill-[#F2D76B]" />
                  <span>Executive Operations Centre</span>
                </span>
                <span
                  className={clsx(
                    'text-xs font-semibold',
                    isDark ? 'text-[#B5B2AD]' : 'text-secondary'
                  )}
                >
                  {formatDate(todayIST())}
                </span>
              </div>
              <h1
                className={clsx(
                  'text-2xl sm:text-3xl font-black tracking-tight',
                  isDark ? 'text-[#F5F3EE]' : 'text-primary'
                )}
              >
                {greeting}, Design Lead.
              </h1>
              <p
                className={clsx(
                  'text-sm leading-relaxed',
                  isDark ? 'text-[#B5B2AD]' : 'text-secondary'
                )}
              >
                Real-time cross-functional command centre. Overseeing{' '}
                <strong
                  className={clsx(
                    'font-bold',
                    isDark ? 'text-[#F5F3EE]' : 'text-primary'
                  )}
                >
                  {activeProjects.length} active client projects
                </strong>{' '}
                with{' '}
                <strong
                  className={clsx(
                    'font-bold',
                    isDark ? 'text-[#F5F3EE]' : 'text-primary'
                  )}
                >
                  {presentTodayCount} of {activeEmployees.length} members present
                </strong>{' '}
                today.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {/* Prominent Dashboard Theme Switch */}
              <DashboardThemeToggle />

              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/attendance')}
                className={clsx(
                  'border-[0.5px] font-bold transition-colors',
                  isDark
                    ? 'bg-[#27272B] hover:bg-[#303036] border-[#393940] text-[#F5F3EE]'
                    : 'bg-white hover:bg-gray-50 border-black text-primary'
                )}
                icon={<Clock className="w-4 h-4 text-accent" />}
              >
                Daily Register
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/projects')}
                className={clsx(
                  'shadow-soft font-bold border-[0.5px] transition-colors',
                  isDark
                    ? 'bg-[#F5F3EE] hover:bg-white text-[#141414] border-[#F5F3EE]'
                    : 'bg-[#222222] hover:bg-[#333333] text-white border-black'
                )}
                icon={<Plus className="w-4 h-4" />}
              >
                Manage Projects
              </Button>
            </div>
          </div>

          {/* Decorative subtle pastel glow accents */}
          <div
            className={clsx(
              'absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-opacity',
              isDark ? 'bg-[#F2D76B]/5' : 'bg-[#F2D76B]/15'
            )}
          />
          <div
            className={clsx(
              'absolute right-32 -bottom-20 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-opacity',
              isDark ? 'bg-[#AFC7E9]/8' : 'bg-[#AFC7E9]/20'
            )}
          />
        </div>

      {/* 2. UPGRADED CORE KPI METRICS ROW (WITH MICRO-VISUALISATIONS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          label="Active Projects"
          value={activeProjects.length}
          icon={<FolderKanban className="w-5 h-5" />}
          color="pink"
          subtitle={`${projects.length} Total Initiatives`}
          microVisual={projectsMicroVisual}
          onClick={() => navigate('/projects')}
        />
        <MetricCard
          label="Team Present Today"
          value={`${presentTodayCount} / ${activeEmployees.length}`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
          subtitle={`${onLeaveTodayCount} On Approved Leave`}
          microVisual={attendanceMicroVisual}
          onClick={() => navigate('/attendance')}
        />
        <MetricCard
          label="Tasks In Progress"
          value={inProgressTasks.length}
          icon={<Layers className="w-5 h-5" />}
          color="blue"
          subtitle={`${reviewTasks.length} Ready for Review`}
          microVisual={tasksMicroVisual}
          onClick={() => navigate('/tasks')}
        />
        <MetricCard
          label="Pending Approvals"
          value={extSummary.pendingApprovalsCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="yellow"
          subtitle={
            extSummary.pendingApprovalsCount > 0
              ? 'Lead Authorization Required'
              : 'All Authorizations Clear'
          }
          microVisual={approvalsMicroVisual}
          onClick={() => navigate('/attendance')}
        />
      </div>

      {/* 3. PRIMARY VISUALISATIONS: PORTFOLIO DONUT + TASK HEALTH & DEADLINE ADHERENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectStatusDonut projects={projects} />
        <TaskAnalyticsCard tasks={tasks} />
      </div>

      {/* 4. CROSS-FUNCTIONAL PROGRESS & WORKLOAD VISUALISATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectProgressComparison projects={projects} tasks={tasks} limit={5} />
        <TeamWorkloadBar employees={activeEmployees} tasks={tasks} />
      </div>

      {/* 5. VELOCITY PROGRESSION & ATTENDANCE / OVERTIME ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityTrendChart activities={activities} tasks={tasks} />
        <AttendanceAnalyticsCard
          todayAttendance={todayAttendance}
          activeEmployeeCount={activeEmployees.length}
          extSummary={extSummary}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {/* 6. COMPACT ATTENDANCE EXCEPTIONS & WEEKEND WORK SECTION */}
      {(recentPermissions.length > 0 ||
        recentEarly.length > 0 ||
        recentExtended.length > 0 ||
        recentExtraWork.length > 0) && (
        <Card
          className={clsx(
            'p-6 space-y-4 border-[0.5px]',
            isDark
              ? 'bg-[#1F1F22] border-[#393940] text-[#F5F3EE]'
              : 'border-black bg-surface'
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3
                className={clsx(
                  'text-base font-bold',
                  isDark ? 'text-[#F5F3EE]' : 'text-primary'
                )}
              >
                Recent Attendance Exceptions & Weekend Deliveries
              </h3>
              <p
                className={clsx(
                  'text-xs mt-0.5',
                  isDark ? 'text-[#B5B2AD]' : 'text-secondary'
                )}
              >
                Overview of recent permissions, early departures, and overtime sessions awaiting or authorized by Lead
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/attendance')}
              className={clsx(
                'border-[0.5px] text-xs font-bold self-start sm:self-auto',
                isDark
                  ? 'bg-[#27272B] hover:bg-[#303036] border-[#393940] text-[#F5F3EE]'
                  : 'bg-white hover:bg-gray-50 border-black'
              )}
            >
              Full Register & Approvals
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Half-Day Permissions Card */}
            <div
              className={clsx(
                'p-4 rounded-xl border-[0.5px] space-y-2.5 transition-colors',
                isDark
                  ? 'bg-[#27272B] border-[#393940]'
                  : 'bg-[#FFFDF7] border-black/20'
              )}
            >
              <div
                className={clsx(
                  'flex items-center justify-between font-bold',
                  isDark ? 'text-[#F5F3EE]' : 'text-primary'
                )}
              >
                <span>Half-Day Perms</span>
                <span className="text-[11px] text-accent font-semibold">
                  {recentPermissions.length} recent
                </span>
              </div>
              <div className="space-y-2">
                {recentPermissions.length === 0 ? (
                  <p className={clsx('text-xs italic', isDark ? 'text-[#85838A]' : 'text-secondary')}>
                    No permissions logged
                  </p>
                ) : (
                  recentPermissions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate('/attendance')}
                      className={clsx(
                        'cursor-pointer p-1.5 rounded-lg transition-colors border-[0.5px]',
                        isDark
                          ? 'hover:bg-[#303036] border-transparent hover:border-[#4E4E57]'
                          : 'hover:bg-[#EEE9DD]/50 border-transparent hover:border-black/20'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={clsx(
                            'font-semibold truncate max-w-[120px]',
                            isDark ? 'text-[#F5F3EE]' : 'text-primary'
                          )}
                        >
                          {p.employee?.name}
                        </span>
                        <ApprovalBadge status={p.approval_status} />
                      </div>
                      <div
                        className={clsx(
                          'text-[11px] mt-0.5',
                          isDark ? 'text-[#B5B2AD]' : 'text-secondary'
                        )}
                      >
                        {formatDate(p.permission_date)} • {HALF_DAY_LABELS[p.half_day_period]}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Early Log-Offs Card */}
            <div
              className={clsx(
                'p-4 rounded-xl border-[0.5px] space-y-2.5 transition-colors',
                isDark
                  ? 'bg-[#27272B] border-[#393940]'
                  : 'bg-[#FFFDF7] border-black/20'
              )}
            >
              <div
                className={clsx(
                  'flex items-center justify-between font-bold',
                  isDark ? 'text-[#F5F3EE]' : 'text-primary'
                )}
              >
                <span>Early Log-Offs</span>
                <span className="text-[11px] text-[#F2D76B] font-semibold">
                  {recentEarly.length} recent
                </span>
              </div>
              <div className="space-y-2">
                {recentEarly.length === 0 ? (
                  <p className={clsx('text-xs italic', isDark ? 'text-[#85838A]' : 'text-secondary')}>
                    No early departures
                  </p>
                ) : (
                  recentEarly.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => navigate('/attendance')}
                      className={clsx(
                        'cursor-pointer p-1.5 rounded-lg transition-colors border-[0.5px]',
                        isDark
                          ? 'hover:bg-[#303036] border-transparent hover:border-[#4E4E57]'
                          : 'hover:bg-[#EEE9DD]/50 border-transparent hover:border-black/20'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={clsx(
                            'font-semibold truncate max-w-[120px]',
                            isDark ? 'text-[#F5F3EE]' : 'text-primary'
                          )}
                        >
                          {e.employee?.name}
                        </span>
                        <ApprovalBadge status={e.approval_status} />
                      </div>
                      <div className="text-[11px] text-[#F2D76B] font-medium mt-0.5">
                        {formatDate(e.logoff_date)} • {formatMinutes(e.difference_minutes)} early
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Extended Hours Card */}
            <div
              className={clsx(
                'p-4 rounded-xl border-[0.5px] space-y-2.5 transition-colors',
                isDark
                  ? 'bg-[#27272B] border-[#393940]'
                  : 'bg-[#FFFDF7] border-black/20'
              )}
            >
              <div
                className={clsx(
                  'flex items-center justify-between font-bold',
                  isDark ? 'text-[#F5F3EE]' : 'text-primary'
                )}
              >
                <span>Extended Hours</span>
                <span className="text-[11px] text-[#AFC7E9] font-semibold">
                  {recentExtended.length} recent
                </span>
              </div>
              <div className="space-y-2">
                {recentExtended.length === 0 ? (
                  <p className={clsx('text-xs italic', isDark ? 'text-[#85838A]' : 'text-secondary')}>
                    No extended hours
                  </p>
                ) : (
                  recentExtended.map((x) => (
                    <div
                      key={x.id}
                      onClick={() => navigate('/attendance')}
                      className={clsx(
                        'cursor-pointer p-1.5 rounded-lg transition-colors border-[0.5px]',
                        isDark
                          ? 'hover:bg-[#303036] border-transparent hover:border-[#4E4E57]'
                          : 'hover:bg-[#EEE9DD]/50 border-transparent hover:border-black/20'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={clsx(
                            'font-semibold truncate max-w-[120px]',
                            isDark ? 'text-[#F5F3EE]' : 'text-primary'
                          )}
                        >
                          {x.employee?.name}
                        </span>
                        <ApprovalBadge status={x.approval_status} />
                      </div>
                      <div
                        className={clsx(
                          'text-[11px] mt-0.5',
                          isDark ? 'text-[#B5B2AD]' : 'text-secondary'
                        )}
                      >
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
            <div
              className={clsx(
                'p-4 rounded-xl border-[0.5px] space-y-2.5 transition-colors',
                isDark
                  ? 'bg-[#27272B] border-[#393940]'
                  : 'bg-[#FFFDF7] border-black/20'
              )}
            >
              <div
                className={clsx(
                  'flex items-center justify-between font-bold',
                  isDark ? 'text-[#F5F3EE]' : 'text-primary'
                )}
              >
                <span>Weekend Sessions</span>
                <span className="text-[11px] text-[#EFAED0] font-semibold">
                  {recentExtraWork.length} recent
                </span>
              </div>
              <div className="space-y-2">
                {recentExtraWork.length === 0 ? (
                  <p className={clsx('text-xs italic', isDark ? 'text-[#85838A]' : 'text-secondary')}>
                    No weekend sessions
                  </p>
                ) : (
                  recentExtraWork.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => navigate('/attendance')}
                      className={clsx(
                        'cursor-pointer p-1.5 rounded-lg transition-colors border-[0.5px]',
                        isDark
                          ? 'hover:bg-[#303036] border-transparent hover:border-[#4E4E57]'
                          : 'hover:bg-[#EEE9DD]/50 border-transparent hover:border-black/20'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={clsx(
                            'font-semibold truncate max-w-[120px]',
                            isDark ? 'text-[#F5F3EE]' : 'text-primary'
                          )}
                        >
                          {w.employee?.name}
                        </span>
                        <ApprovalBadge status={w.approval_status} />
                      </div>
                      <div className="text-[11px] text-[#EFAED0] font-semibold mt-0.5">
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

      {/* 7. LIVE OPERATIONS CHRONOLOGY & TEAM WORKLOAD DIRECTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Team Activity & Workload Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            className={clsx(
              'p-6 border-[0.5px]',
              isDark
                ? 'bg-[#1F1F22] border-[#393940] text-[#F5F3EE]'
                : 'border-black bg-surface'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3
                  className={clsx(
                    'text-base font-bold',
                    isDark ? 'text-[#F5F3EE]' : 'text-primary'
                  )}
                >
                  Team Operations Roster
                </h3>
                <p
                  className={clsx(
                    'text-xs mt-0.5',
                    isDark ? 'text-[#B5B2AD]' : 'text-secondary'
                  )}
                >
                  Current assignments, stage progression, presence register, and deadlines
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className={clsx(
                    'px-3 py-1.5 text-xs border-[0.5px] rounded-xl focus:outline-none focus:ring-1 focus:ring-accent w-36 font-medium',
                    isDark
                      ? 'bg-[#27272B] border-[#393940] text-[#F5F3EE] placeholder-[#85838A]'
                      : 'bg-[#EEE9DD] border-black text-primary'
                  )}
                />

                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className={clsx(
                    'px-3 py-1.5 text-xs border-[0.5px] rounded-xl focus:outline-none focus:ring-1 focus:ring-accent font-bold',
                    isDark
                      ? 'bg-[#27272B] border-[#393940] text-[#F5F3EE]'
                      : 'bg-[#EEE9DD] border-black text-primary'
                  )}
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
                  <tr
                    className={clsx(
                      'border-b-[0.5px] text-[11px] font-bold uppercase tracking-wider',
                      isDark
                        ? 'border-[#393940] text-[#B5B2AD] bg-[#27272B]'
                        : 'border-black text-secondary bg-[#EEE9DD]/40'
                    )}
                  >
                    <th className="py-3 px-3.5">Employee</th>
                    <th className="py-3 px-3.5">Today's Presence</th>
                    <th className="py-3 px-3.5">Current Deliverable</th>
                    <th className="py-3 px-3.5">Stage</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5">Due Date</th>
                  </tr>
                </thead>
                <tbody
                  className={clsx(
                    'divide-y-[0.5px] text-xs',
                    isDark ? 'divide-[#393940]' : 'divide-black/10'
                  )}
                >
                  {filteredEmployees.map((emp) => {
                    const empTasks = tasks.filter(
                      (t) =>
                        t.assignees?.some(
                          (a: any) => a.employee?.id === emp.id || a.employee_id === emp.id
                        ) &&
                        t.status !== 'completed'
                    );
                    const currentTask = empTasks[0];
                    const attendance = todayAttendance.find((a) => a.employee_id === emp.id);

                    return (
                      <tr
                        key={emp.id}
                        className={clsx(
                          'transition-colors cursor-pointer',
                          isDark ? 'hover:bg-[#27272B]' : 'hover:bg-[#EEE9DD]/30'
                        )}
                        onClick={() => navigate(`/team/${emp.id}`)}
                      >
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={clsx(
                                'w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 border-[0.5px]',
                                isDark
                                  ? 'bg-[#303036] border-[#4E4E57] text-[#AFC7E9]'
                                  : 'bg-[#EFAED0]/30 text-[#782046] border-black/30'
                              )}
                            >
                              {emp.initials || emp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p
                                className={clsx(
                                  'font-bold truncate max-w-[140px]',
                                  isDark ? 'text-[#F5F3EE]' : 'text-primary'
                                )}
                              >
                                {emp.name}
                              </p>
                              <p
                                className={clsx(
                                  'text-[10px] truncate max-w-[140px]',
                                  isDark ? 'text-[#85838A]' : 'text-secondary'
                                )}
                              >
                                {emp.designation}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          {attendance ? (
                            <AttendanceBadge status={attendance.status} />
                          ) : (
                            <span className={clsx('text-[11px] italic', isDark ? 'text-[#85838A]' : 'text-secondary')}>
                              Unrecorded
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5">
                          {currentTask ? (
                            <div className="min-w-0">
                              <p
                                className={clsx(
                                  'font-semibold truncate max-w-[180px]',
                                  isDark ? 'text-[#F5F3EE]' : 'text-primary'
                                )}
                              >
                                {currentTask.title}
                              </p>
                              <p
                                className={clsx(
                                  'text-[10px] truncate max-w-[180px]',
                                  isDark ? 'text-[#85838A]' : 'text-secondary'
                                )}
                              >
                                {currentTask.project?.name || '—'}
                              </p>
                            </div>
                          ) : (
                            <span className={clsx('italic', isDark ? 'text-[#85838A]' : 'text-secondary')}>
                              No active task
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5">
                          <span
                            className={clsx(
                              'text-[11px] font-medium',
                              isDark ? 'text-[#B5B2AD]' : 'text-secondary'
                            )}
                          >
                            {currentTask?.workflow_stage?.name || '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          {currentTask ? (
                            <StatusBadge status={currentTask.status} />
                          ) : (
                            <span className={isDark ? 'text-[#85838A]' : 'text-secondary'}>—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <span
                            className={clsx(
                              'text-[11px] font-medium',
                              isDark ? 'text-[#B5B2AD]' : 'text-secondary'
                            )}
                          >
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

        {/* Right 1 Col: Visual Chronological Operations Audit Log */}
        <div className="space-y-4">
          <ActivityTimelineView activities={activities} employees={employees} projects={projects} />
        </div>
      </div>
    </div>
  );
};
