import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, MetricCard } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { StatusBadge, AttendanceBadge, ApprovalBadge } from '@/components/shared/Badge';
import { supabase } from '@/services/supabase/client';
import { getEmployeeProjects } from '@/utils/employeeProjects';
import { getEmployeeById } from '@/services/supabase/employees';
import { getTasks } from '@/services/supabase/tasks';
import { getProjects } from '@/services/supabase/projects';
import { getAttendanceByEmployee } from '@/services/supabase/attendance';
import { getLeaveRecords } from '@/services/supabase/leave';
import {
  getAttendancePermissions,
  getEarlyLogoffs,
  getExtendedAvailability,
  getExtraWorkRecords,
  getAttendanceExtensionsSummary,
  AttendanceExtensionSummary,
} from '@/services/supabase/attendanceExtensions';
import {
  Employee,
  Task,
  Project,
  AttendanceRecord,
  LeaveRecord,
  AttendancePermission,
  EarlyLogoff,
  ExtendedAvailability,
  ExtraWorkRecord,
  HALF_DAY_LABELS,
  EXTENDED_ACTIVITY_LABELS,
} from '@/types';
import { formatDate, formatTime, formatHours } from '@/utils/dates';
import { summariseAttendance, formatMinutes } from '@/utils/calculations';
import { useToast } from '@/store/useAppStore';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  FileText,
  Briefcase,
  Moon,
  CheckSquare,
} from 'lucide-react';

export const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);

  // Attendance Extensions
  const [permissions, setPermissions] = useState<AttendancePermission[]>([]);
  const [earlyLogoffs, setEarlyLogoffs] = useState<EarlyLogoff[]>([]);
  const [extendedHours, setExtendedHours] = useState<ExtendedAvailability[]>([]);
  const [extraWork, setExtraWork] = useState<ExtraWorkRecord[]>([]);
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

  const [loading, setLoading] = useState(true);

  // Tab: tasks | attendance | extra_work | leaves | projects
  const [activeTab, setActiveTab] = useState<
    'tasks' | 'attendance' | 'extra_work' | 'leaves' | 'projects'
  >('tasks');

  // Sub-tab for extra_work: permissions | early_logoff | extended | weekend
  const [extraWorkSubTab, setExtraWorkSubTab] = useState<
    'permissions' | 'early_logoff' | 'extended' | 'weekend'
  >('permissions');

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (empId: string) => {
    try {
      setLoading(true);

      // 1. Fetch employee first with resilient fallbacks
      let emp: Employee | null = null;
      try {
        emp = await getEmployeeById(empId);
      } catch (err) {
        console.warn('getEmployeeById caught error:', err);
      }

      if (!emp) {
        try {
          const { data: directData } = await supabase
            .from('employees')
            .select('*, department:departments(*)')
            .eq('id', empId)
            .maybeSingle();
          if (directData) emp = directData as Employee;
        } catch {
          // Safe to ignore
        }
      }

      if (!emp) {
        try {
          const { data: plainData } = await supabase
            .from('employees')
            .select('*')
            .eq('id', empId)
            .maybeSingle();
          if (plainData) emp = plainData as Employee;
        } catch {
          // Safe to ignore
        }
      }

      if (emp) {
        setEmployee(emp);
      }

      // 2. Fetch all related collections using Promise.allSettled
      // so NO secondary failure blocks displaying the employee profile!
      const results = await Promise.allSettled([
        getTasks({ employeeId: empId }),
        getProjects({ includeArchived: true }),
        getAttendanceByEmployee(empId),
        getLeaveRecords({ employeeId: empId }),
        getAttendancePermissions({ employeeId: empId }),
        getEarlyLogoffs({ employeeId: empId }),
        getExtendedAvailability({ employeeId: empId }),
        getExtraWorkRecords({ employeeId: empId }),
        getAttendanceExtensionsSummary({ employeeId: empId }),
      ]);

      const [
        tasksRes,
        projectsRes,
        attRes,
        leavesRes,
        permsRes,
        earlyRes,
        extRes,
        extraRes,
        summaryRes,
      ] = results;

      const loadedTasks = tasksRes.status === 'fulfilled' ? tasksRes.value || [] : [];
      const loadedProjects = projectsRes.status === 'fulfilled' ? projectsRes.value || [] : [];

      setTasks(loadedTasks);

      // Robust "Projects Handled" calculation:
      // Includes projects where employee is owner, member, OR has assigned tasks
      const memberProjects = getEmployeeProjects(empId, loadedProjects, loadedTasks);
      setProjects(memberProjects);

      if (attRes.status === 'fulfilled') setAttendance(attRes.value || []);
      if (leavesRes.status === 'fulfilled') setLeaves(leavesRes.value || []);
      if (permsRes.status === 'fulfilled') setPermissions(permsRes.value || []);
      if (earlyRes.status === 'fulfilled') setEarlyLogoffs(earlyRes.value || []);
      if (extRes.status === 'fulfilled') setExtendedHours(extRes.value || []);
      if (extraRes.status === 'fulfilled') setExtraWork(extraRes.value || []);
      if (summaryRes.status === 'fulfilled') setExtSummary(summaryRes.value);
    } catch (err) {
      console.error('Failed to load employee details:', err);
      toast.error('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  if (!employee && !loading) {
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto p-6 bg-surface rounded-2xl border-[0.5px] border-black shadow-soft">
          <p className="text-base font-bold text-primary">Employee Record Not Found</p>
          <p className="text-xs text-secondary mt-1">
            This employee could not be located or may have been archived.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => id && loadData(id)}
              className="border-[0.5px] border-black text-xs font-bold"
            >
              Retry
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/team')}
              className="border-[0.5px] border-black text-xs font-bold"
            >
              ← Back to Team
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const workingTasks = tasks.filter((t) => t.status === 'working');
  const blockedTasks = tasks.filter((t) => t.status === 'blocked');
  const attSummary = summariseAttendance(attendance);

  const totalExtraWorkRecords =
    permissions.length + earlyLogoffs.length + extendedHours.length + extraWork.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/team')}
          className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary mb-3 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Team Directory
        </button>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-accent text-white font-bold text-2xl flex items-center justify-center shadow-sm">
                {employee?.initials || employee?.name?.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-primary">{employee?.name}</h1>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      employee?.status === 'active'
                        ? 'bg-emerald-50 text-success border border-emerald-200'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {employee?.status === 'active' ? 'Active Employee' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-secondary font-medium mt-0.5">
                  {employee?.designation} • {employee?.department?.name || 'Design'}
                </p>

                <div className="flex items-center gap-4 mt-2 text-xs text-secondary">
                  {employee?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> {employee.email}
                    </span>
                  )}
                  {employee?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {employee.phone}
                    </span>
                  )}
                  {employee?.joining_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" /> Joined {formatDate(employee.joining_date)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/reports')}
              icon={<FileText className="w-4 h-4 text-accent" />}
            >
              Generate Statement
            </Button>
          </div>
        </Card>
      </div>

      {/* Metrics Row 1: Core Performance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Assigned Projects"
          value={projects.length}
          icon={<FolderKanban className="w-5 h-5" />}
          color="accent"
        />
        <MetricCard
          label="In Progress"
          value={workingTasks.length}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
        <MetricCard
          label="Completed Tasks"
          value={completedTasks.length}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
        />
        <MetricCard
          label="Blocked Tasks"
          value={blockedTasks.length}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={blockedTasks.length > 0 ? 'danger' : 'primary'}
        />
        <MetricCard
          label="Office Hours"
          value={formatHours(attSummary.totalHours)}
          icon={<Clock className="w-5 h-5" />}
          color="primary"
          subtitle="Recorded total"
        />
        <MetricCard
          label="Days Present"
          value={attSummary.present}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
          subtitle={`${attSummary.leave} Leave days`}
        />
      </div>

      {/* Metrics Row 2: Attendance Exceptions & Extra Work Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Half-Day Perms"
          value={extSummary.halfDayPermissionsCount}
          icon={<Clock className="w-4 h-4" />}
          color="warning"
          subtitle={`${formatMinutes(extSummary.halfDayDurationMinutes)} total`}
        />
        <MetricCard
          label="Early Log-Offs"
          value={extSummary.earlyLogoffsCount}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="warning"
          subtitle={`${formatMinutes(extSummary.earlyLogoffMinutes)} total`}
        />
        <MetricCard
          label="Ext. Active Work"
          value={`${(extSummary.extendedActiveMinutes / 60).toFixed(1)}h`}
          icon={<Briefcase className="w-4 h-4" />}
          color="accent"
          subtitle="After 18:00"
        />
        <MetricCard
          label="Ext. Standby"
          value={`${(extSummary.extendedStandbyMinutes / 60).toFixed(1)}h`}
          icon={<Moon className="w-4 h-4" />}
          color="primary"
          subtitle="Standby Hours"
        />
        <MetricCard
          label="Saturday Work"
          value={`${(extSummary.saturdayExtraMinutes / 60).toFixed(1)}h`}
          icon={<Calendar className="w-4 h-4" />}
          color="accent"
          subtitle="Saturday Sessions"
        />
        <MetricCard
          label="Sunday Work"
          value={`${(extSummary.sundayExtraMinutes / 60).toFixed(1)}h`}
          icon={<Calendar className="w-4 h-4" />}
          color="primary"
          subtitle="Sunday Sessions"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-6 text-xs font-semibold">
        {(['tasks', 'attendance', 'extra_work', 'leaves', 'projects'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === tab
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <span>{tab === 'extra_work' ? 'Extra Work & Exceptions' : tab}</span>
            {tab === 'tasks' && ` (${tasks.length})`}
            {tab === 'attendance' && ` (${attendance.length})`}
            {tab === 'extra_work' && ` (${totalExtraWorkRecords})`}
            {tab === 'leaves' && ` (${leaves.length})`}
            {tab === 'projects' && ` (${projects.length})`}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* 1. TASKS TAB */}
      {activeTab === 'tasks' && (
        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                  <th className="py-2.5 px-3">Task Title</th>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/80">
                    <td className="py-3 px-3 font-semibold text-primary">{task.title}</td>
                    <td className="py-3 px-3 text-secondary">{task.project?.name || '—'}</td>
                    <td className="py-3 px-3">
                      <span className="font-medium capitalize">{task.priority}</span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-3 px-3 text-secondary">{formatDate(task.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length === 0 && (
              <p className="text-xs text-secondary text-center py-8">No tasks recorded</p>
            )}
          </div>
        </Card>
      )}

      {/* 2. ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Arrival</th>
                  <th className="py-2.5 px-3">Departure</th>
                  <th className="py-2.5 px-3">Break</th>
                  <th className="py-2.5 px-3">Total Hours</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/80">
                    <td className="py-2.5 px-3 font-medium text-primary">{formatDate(rec.date)}</td>
                    <td className="py-2.5 px-3">
                      <AttendanceBadge status={rec.status} />
                    </td>
                    <td className="py-2.5 px-3">{formatTime(rec.arrival_time)}</td>
                    <td className="py-2.5 px-3">{formatTime(rec.departure_time)}</td>
                    <td className="py-2.5 px-3">
                      {rec.break_duration_minutes ? `${rec.break_duration_minutes}m` : '0m'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-primary">
                      {formatHours(rec.total_hours)}
                    </td>
                    <td className="py-2.5 px-3 text-secondary">{rec.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendance.length === 0 && (
              <p className="text-xs text-secondary text-center py-8">No attendance records yet</p>
            )}
          </div>
        </Card>
      )}

      {/* 3. EXTRA WORK & EXCEPTIONS TAB */}
      {activeTab === 'extra_work' && (
        <div className="space-y-4">
          {/* Sub-nav pills */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold w-fit">
            <button
              onClick={() => setExtraWorkSubTab('permissions')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                extraWorkSubTab === 'permissions'
                  ? 'bg-white text-primary shadow-xs font-bold'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Half-Day Permissions ({permissions.length})
            </button>
            <button
              onClick={() => setExtraWorkSubTab('early_logoff')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                extraWorkSubTab === 'early_logoff'
                  ? 'bg-white text-primary shadow-xs font-bold'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Early Log-Offs ({earlyLogoffs.length})
            </button>
            <button
              onClick={() => setExtraWorkSubTab('extended')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                extraWorkSubTab === 'extended'
                  ? 'bg-white text-primary shadow-xs font-bold'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Extended Hours ({extendedHours.length})
            </button>
            <button
              onClick={() => setExtraWorkSubTab('weekend')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                extraWorkSubTab === 'weekend'
                  ? 'bg-white text-primary shadow-xs font-bold'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Weekend Extra Work ({extraWork.length})
            </button>
          </div>

          {/* Sub-tab 1: Permissions */}
          {extraWorkSubTab === 'permissions' && (
            <Card className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Time Window</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Admin Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {permissions.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-3 font-medium text-primary">
                          {formatDate(p.permission_date)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {HALF_DAY_LABELS[p.half_day_period]}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-secondary">
                          {p.start_time.slice(0, 5)} - {p.end_time.slice(0, 5)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-accent">
                          {formatMinutes(p.duration_minutes)}
                        </td>
                        <td className="py-2.5 px-3 text-secondary">{p.reason || '—'}</td>
                        <td className="py-2.5 px-3">
                          <ApprovalBadge status={p.approval_status} />
                        </td>
                        <td className="py-2.5 px-3 text-secondary">{p.admin_remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {permissions.length === 0 && (
                  <p className="text-xs text-secondary text-center py-8">
                    No half-day permissions on record
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Sub-tab 2: Early Log-offs */}
          {extraWorkSubTab === 'early_logoff' && (
            <Card className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Standard Closing</th>
                      <th className="py-2.5 px-3">Actual Departure</th>
                      <th className="py-2.5 px-3">Early Duration</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Admin Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {earlyLogoffs.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-3 font-medium text-primary">
                          {formatDate(e.logoff_date)}
                        </td>
                        <td className="py-2.5 px-3 text-secondary">
                          {e.scheduled_departure_time.slice(0, 5)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-amber-700">
                          {e.actual_departure_time.slice(0, 5)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-600">
                          {formatMinutes(e.difference_minutes)} early
                        </td>
                        <td className="py-2.5 px-3 text-secondary">{e.reason || '—'}</td>
                        <td className="py-2.5 px-3">
                          <ApprovalBadge status={e.approval_status} />
                        </td>
                        <td className="py-2.5 px-3 text-secondary">{e.admin_remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {earlyLogoffs.length === 0 && (
                  <p className="text-xs text-secondary text-center py-8">
                    No early log-off records logged
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Sub-tab 3: Extended Hours */}
          {extraWorkSubTab === 'extended' && (
            <Card className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Activity Type</th>
                      <th className="py-2.5 px-3">Hours Window</th>
                      <th className="py-2.5 px-3">Active Duration</th>
                      <th className="py-2.5 px-3">Standby</th>
                      <th className="py-2.5 px-3">Project</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {extendedHours.map((x) => (
                      <tr key={x.id} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-3 font-medium text-primary">
                          {formatDate(x.availability_date)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              x.activity_type === 'standby'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {EXTENDED_ACTIVITY_LABELS[x.activity_type]}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-secondary">
                          {x.regular_closing_time.slice(0, 5)} - {x.actual_end_time.slice(0, 5)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-blue-700">
                          {formatMinutes(x.active_work_minutes)}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-amber-700">
                          {formatMinutes(x.standby_minutes)}
                        </td>
                        <td className="py-2.5 px-3 text-secondary">{x.project?.name || '—'}</td>
                        <td className="py-2.5 px-3">
                          <ApprovalBadge status={x.approval_status} />
                        </td>
                        <td className="py-2.5 px-3 text-secondary">
                          {x.reason || x.admin_remarks || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {extendedHours.length === 0 && (
                  <p className="text-xs text-secondary text-center py-8">
                    No extended availability sessions recorded
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Sub-tab 4: Weekend Extra Work */}
          {extraWorkSubTab === 'weekend' && (
            <Card className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                      <th className="py-2.5 px-3">Day & Date</th>
                      <th className="py-2.5 px-3">Related Project</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Timing</th>
                      <th className="py-2.5 px-3">Total Duration</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {extraWork.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mr-1.5 ${
                              w.work_day_type === 'saturday'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {w.work_day_type}
                          </span>
                          <span className="font-semibold text-primary">{formatDate(w.work_date)}</span>
                        </td>
                        <td className="py-2.5 px-3 text-accent font-medium">
                          {w.project?.name || <span className="text-secondary italic">Standalone</span>}
                        </td>
                        <td className="py-2.5 px-3 text-primary">{w.work_description}</td>
                        <td className="py-2.5 px-3 text-secondary">
                          {w.start_time.slice(0, 5)} - {w.end_time.slice(0, 5)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-primary">
                          {formatMinutes(w.total_minutes)}
                        </td>
                        <td className="py-2.5 px-3">
                          <ApprovalBadge status={w.approval_status} />
                        </td>
                        <td className="py-2.5 px-3 text-secondary">{w.admin_remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {extraWork.length === 0 && (
                  <p className="text-xs text-secondary text-center py-8">
                    No weekend extra work sessions recorded
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 4. LEAVES TAB */}
      {activeTab === 'leaves' && (
        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Days</th>
                  <th className="py-2.5 px-3">Approval</th>
                  <th className="py-2.5 px-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/80">
                    <td className="py-2.5 px-3 font-semibold text-primary capitalize">
                      {l.category.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-secondary">
                      {formatDate(l.start_date)} to {formatDate(l.end_date)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-primary">{l.num_days}d</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-success text-[10px] font-semibold border border-emerald-200 uppercase">
                        {l.approval_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-secondary">{l.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaves.length === 0 && (
              <p className="text-xs text-secondary text-center py-8">No leave records</p>
            )}
          </div>
        </Card>
      )}

      {/* 5. PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <Card
              key={proj.id}
              onClick={() => navigate(`/projects/${proj.id}`)}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <StatusBadge status={proj.status} />
                <span className="text-[11px] text-secondary">
                  {formatDate(proj.target_delivery_date)}
                </span>
              </div>
              <h4 className="font-bold text-sm text-primary">{proj.name}</h4>
              {proj.client_name && (
                <p className="text-xs text-accent mt-0.5">{proj.client_name}</p>
              )}
            </Card>
          ))}
          {projects.length === 0 && (
            <p className="text-xs text-secondary text-center py-8 col-span-3">
              No projects assigned
            </p>
          )}
        </div>
      )}
    </div>
  );
};
