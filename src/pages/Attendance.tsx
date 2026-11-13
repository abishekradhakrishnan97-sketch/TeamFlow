import React, { useState, useEffect } from 'react';
import { Card, MetricCard } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { AttendanceBadge, ApprovalBadge } from '@/components/shared/Badge';
import {
  getAttendanceByDate,
  recordAttendance,
  bulkRecordAttendance,
} from '@/services/supabase/attendance';
import { getEmployees } from '@/services/supabase/employees';
import { getProjects } from '@/services/supabase/projects';
import {
  getAttendancePermissions,
  createAttendancePermission,
  updateAttendancePermission,
  deleteAttendancePermission,
  getEarlyLogoffs,
  createEarlyLogoff,
  updateEarlyLogoff,
  deleteEarlyLogoff,
  getExtendedAvailability,
  createExtendedAvailability,
  updateExtendedAvailability,
  deleteExtendedAvailability,
  getExtraWorkRecords,
  createExtraWorkRecord,
  updateExtraWorkRecord,
  deleteExtraWorkRecord,
} from '@/services/supabase/attendanceExtensions';
import {
  AttendanceRecord,
  Employee,
  Project,
  AttendanceStatus,
  AttendancePermission,
  EarlyLogoff,
  ExtendedAvailability,
  ExtraWorkRecord,
  ApprovalStatus,
  HalfDayPeriod,
  ExtendedActivityType,
  WorkDayType,
  HALF_DAY_LABELS,
  EXTENDED_ACTIVITY_LABELS,
} from '@/types';
import { todayIST, formatDate, formatTime, formatHours, calculateOfficeHours } from '@/utils/dates';
import { summariseAttendance, formatMinutes } from '@/utils/calculations';
import { useToast } from '@/store/useAppStore';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Users,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ListPlus,
  AlertTriangle,
  Plus,
  Check,
  X,
  Trash2,
  FolderKanban,
  CheckSquare,
} from 'lucide-react';

type AttendanceSubTab =
  | 'register'
  | 'permissions'
  | 'early_logoff'
  | 'extended_hours'
  | 'weekend_work'
  | 'approvals';

export const Attendance: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AttendanceSubTab>('register');
  const [selectedDate, setSelectedDate] = useState<string>(todayIST());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Extensions Data
  const [permissions, setPermissions] = useState<AttendancePermission[]>([]);
  const [earlyLogoffs, setEarlyLogoffs] = useState<EarlyLogoff[]>([]);
  const [extendedHours, setExtendedHours] = useState<ExtendedAvailability[]>([]);
  const [extraWork, setExtraWork] = useState<ExtraWorkRecord[]>([]);

  // Filter state for weekend work
  const [weekendFilter, setWeekendFilter] = useState<'all' | 'saturday' | 'sunday'>('all');

  // Single Record Modal (Daily Register)
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formStatus, setFormStatus] = useState<AttendanceStatus>('present');
  const [formArrival, setFormArrival] = useState('09:00');
  const [formDeparture, setFormDeparture] = useState('18:00');
  const [formBreak, setFormBreak] = useState(60);
  const [formRemarks, setFormRemarks] = useState('');

  // Bulk Record Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkEntries, setBulkEntries] = useState<
    Array<{
      employee_id: string;
      name: string;
      status: AttendanceStatus;
      arrival: string;
      departure: string;
      breakMinutes: number;
    }>
  >([]);

  // Modal 1: Half-Day Permission Modal
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permEmployeeId, setPermEmployeeId] = useState('');
  const [permDate, setPermDate] = useState(todayIST());
  const [permPeriod, setPermPeriod] = useState<HalfDayPeriod>('first_half');
  const [permStart, setPermStart] = useState('09:00');
  const [permEnd, setPermEnd] = useState('13:30');
  const [permReason, setPermReason] = useState('');
  const [permStatus, setPermStatus] = useState<ApprovalStatus>('approved');
  const [permRemarks, setPermRemarks] = useState('');

  // Modal 2: Early Log-off Modal
  const [isEarlyModalOpen, setIsEarlyModalOpen] = useState(false);
  const [earlyEmployeeId, setEarlyEmployeeId] = useState('');
  const [earlyDate, setEarlyDate] = useState(todayIST());
  const [earlyScheduledTime, setEarlyScheduledTime] = useState('18:00');
  const [earlyActualTime, setEarlyActualTime] = useState('16:00');
  const [earlyReason, setEarlyReason] = useState('');
  const [earlyStatus, setEarlyStatus] = useState<ApprovalStatus>('approved');
  const [earlyRemarks, setEarlyRemarks] = useState('');

  // Modal 3: Extended Availability Modal
  const [isExtendedModalOpen, setIsExtendedModalOpen] = useState(false);
  const [extEmployeeId, setExtEmployeeId] = useState('');
  const [extDate, setExtDate] = useState(todayIST());
  const [extClosingTime, setExtClosingTime] = useState('18:00');
  const [extEndTime, setExtEndTime] = useState('21:00');
  const [extActivityType, setExtActivityType] = useState<ExtendedActivityType>('active_work');
  const [extActiveMinutes, setExtActiveMinutes] = useState(180);
  const [extStandbyMinutes, setExtStandbyMinutes] = useState(0);
  const [extProjectId, setExtProjectId] = useState('');
  const [extReason, setExtReason] = useState('');
  const [extStatus, setExtStatus] = useState<ApprovalStatus>('approved');
  const [extRemarks, setExtRemarks] = useState('');

  // Modal 4: Weekend Extra Work Modal
  const [isWeekendModalOpen, setIsWeekendModalOpen] = useState(false);
  const [extraEmployeeId, setExtraEmployeeId] = useState('');
  const [extraWorkDayType, setExtraWorkDayType] = useState<WorkDayType>('saturday');
  const [extraDate, setExtraDate] = useState(todayIST());
  const [extraProjectId, setExtraProjectId] = useState('');
  const [extraWorkDescription, setExtraWorkDescription] = useState('');
  const [extraStartTime, setExtraStartTime] = useState('10:00');
  const [extraEndTime, setExtraEndTime] = useState('16:00');
  const [extraStatus, setExtraStatus] = useState<ApprovalStatus>('approved');
  const [extraRemarks, setExtraRemarks] = useState('');

  // Approval review modal
  const [approvalModalItem, setApprovalModalItem] = useState<{
    type: 'permission' | 'early_logoff' | 'extended' | 'extra_work';
    id: string;
    employeeName: string;
    title: string;
    date: string;
  } | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ApprovalStatus>('approved');
  const [reviewRemarks, setReviewRemarks] = useState('');

  useEffect(() => {
    loadBaseData();
  }, [selectedDate]);

  useEffect(() => {
    loadExtensionsData();
  }, []);

  const loadBaseData = async () => {
    try {
      setLoading(true);
      const [att, emp, prj] = await Promise.all([
        getAttendanceByDate(selectedDate),
        getEmployees(),
        getProjects(),
      ]);
      setRecords(att);
      setEmployees(emp);
      setProjects(prj);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const loadExtensionsData = async () => {
    try {
      const [perms, early, ext, extra] = await Promise.all([
        getAttendancePermissions(),
        getEarlyLogoffs(),
        getExtendedAvailability(),
        getExtraWorkRecords(),
      ]);
      setPermissions(perms);
      setEarlyLogoffs(early);
      setExtendedHours(ext);
      setExtraWork(extra);
    } catch (err) {
      console.error('Failed loading attendance extensions:', err);
    }
  };

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Handler for Single Daily Record
  const openSingleModal = (empId?: string, existing?: AttendanceRecord) => {
    if (existing) {
      setEditingRecord(existing);
      setFormEmployeeId(existing.employee_id);
      setFormStatus(existing.status);
      setFormArrival(existing.arrival_time ? existing.arrival_time.slice(0, 5) : '09:00');
      setFormDeparture(existing.departure_time ? existing.departure_time.slice(0, 5) : '18:00');
      setFormBreak(existing.break_duration_minutes ?? 60);
      setFormRemarks(existing.remarks || '');
    } else {
      setEditingRecord(null);
      setFormEmployeeId(empId || employees[0]?.id || '');
      setFormStatus('present');
      setFormArrival('09:00');
      setFormDeparture('18:00');
      setFormBreak(60);
      setFormRemarks('');
    }
    setIsRecordModalOpen(true);
  };

  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId) return;

    try {
      await recordAttendance({
        employee_id: formEmployeeId,
        date: selectedDate,
        status: formStatus,
        arrival_time:
          formStatus === 'present' || formStatus === 'half_day' || formStatus === 'work_from_home'
            ? formArrival
            : undefined,
        departure_time:
          formStatus === 'present' || formStatus === 'half_day' || formStatus === 'work_from_home'
            ? formDeparture
            : undefined,
        break_duration_minutes: formBreak,
        remarks: formRemarks,
      });

      toast.success('Attendance Recorded', 'Record updated in Supabase');
      setIsRecordModalOpen(false);
      loadBaseData();
    } catch (err: any) {
      toast.error('Save failed', err.message);
    }
  };

  // Handler for Bulk Daily Record
  const openBulkModal = () => {
    const initial = employees.map((emp) => {
      const existing = records.find((r) => r.employee_id === emp.id);
      return {
        employee_id: emp.id,
        name: emp.name,
        status: existing?.status || 'present',
        arrival: existing?.arrival_time ? existing.arrival_time.slice(0, 5) : '09:00',
        departure: existing?.departure_time ? existing.departure_time.slice(0, 5) : '18:00',
        breakMinutes: existing?.break_duration_minutes ?? 60,
      };
    });
    setBulkEntries(initial);
    setIsBulkModalOpen(true);
  };

  const handleSaveBulk = async () => {
    try {
      await bulkRecordAttendance(
        selectedDate,
        bulkEntries.map((e) => ({
          employee_id: e.employee_id,
          status: e.status,
          arrival_time:
            e.status === 'present' || e.status === 'half_day' || e.status === 'work_from_home'
              ? e.arrival
              : undefined,
          departure_time:
            e.status === 'present' || e.status === 'half_day' || e.status === 'work_from_home'
              ? e.departure
              : undefined,
          break_duration_minutes: e.breakMinutes,
        }))
      );
      toast.success('Bulk Attendance Saved', `Recorded attendance for ${bulkEntries.length} employees`);
      setIsBulkModalOpen(false);
      loadBaseData();
    } catch (err: any) {
      toast.error('Bulk save failed', err.message);
    }
  };

  // ==========================================
  // HANDLERS: Half-Day Permission
  // ==========================================
  const openAddPermissionModal = () => {
    setPermEmployeeId(employees[0]?.id || '');
    setPermDate(todayIST());
    setPermPeriod('first_half');
    setPermStart('09:00');
    setPermEnd('13:30');
    setPermReason('');
    setPermStatus('approved');
    setPermRemarks('');
    setIsPermissionModalOpen(true);
  };

  const handlePeriodChange = (period: HalfDayPeriod) => {
    setPermPeriod(period);
    if (period === 'first_half') {
      setPermStart('09:00');
      setPermEnd('13:30');
    } else {
      setPermStart('14:00');
      setPermEnd('18:00');
    }
  };

  const handleSavePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permEmployeeId) {
      toast.error('Validation error', 'Please select an employee');
      return;
    }
    try {
      await createAttendancePermission({
        employee_id: permEmployeeId,
        permission_date: permDate,
        half_day_period: permPeriod,
        start_time: permStart,
        end_time: permEnd,
        reason: permReason,
        approval_status: permStatus,
        admin_remarks: permRemarks,
      });
      toast.success('Permission Recorded', 'Half-day permission stored successfully');
      setIsPermissionModalOpen(false);
      loadExtensionsData();
    } catch (err: any) {
      toast.error('Failed to create permission', err.message);
    }
  };

  const handleDeletePermission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this half-day permission record?')) return;
    try {
      await deleteAttendancePermission(id);
      toast.success('Deleted', 'Permission record removed');
      loadExtensionsData();
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  // ==========================================
  // HANDLERS: Early Log-off
  // ==========================================
  const openAddEarlyLogoffModal = () => {
    setEarlyEmployeeId(employees[0]?.id || '');
    setEarlyDate(todayIST());
    setEarlyScheduledTime('18:00');
    setEarlyActualTime('16:00');
    setEarlyReason('');
    setEarlyStatus('approved');
    setEarlyRemarks('');
    setIsEarlyModalOpen(true);
  };

  const calculateEarlyDiff = (scheduled: string, actual: string) => {
    const [sh, sm] = scheduled.split(':').map(Number);
    const [ah, am] = actual.split(':').map(Number);
    return Math.max(0, sh * 60 + sm - (ah * 60 + am));
  };

  const handleSaveEarlyLogoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!earlyEmployeeId) {
      toast.error('Validation error', 'Please select an employee');
      return;
    }
    try {
      await createEarlyLogoff({
        employee_id: earlyEmployeeId,
        logoff_date: earlyDate,
        scheduled_departure_time: earlyScheduledTime,
        actual_departure_time: earlyActualTime,
        reason: earlyReason,
        approval_status: earlyStatus,
        admin_remarks: earlyRemarks,
      });
      toast.success('Early Log-off Recorded', 'Record logged without marking employee absent');
      setIsEarlyModalOpen(false);
      loadExtensionsData();
    } catch (err: any) {
      toast.error('Failed to record early log-off', err.message);
    }
  };

  const handleDeleteEarlyLogoff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this early log-off record?')) return;
    try {
      await deleteEarlyLogoff(id);
      toast.success('Deleted', 'Early log-off record removed');
      loadExtensionsData();
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  // ==========================================
  // HANDLERS: Extended Hours / Late Availability
  // ==========================================
  const openAddExtendedModal = () => {
    setExtEmployeeId(employees[0]?.id || '');
    setExtDate(todayIST());
    setExtClosingTime('18:00');
    setExtEndTime('21:00');
    setExtActivityType('active_work');
    setExtActiveMinutes(180);
    setExtStandbyMinutes(0);
    setExtProjectId('');
    setExtReason('');
    setExtStatus('approved');
    setExtRemarks('');
    setIsExtendedModalOpen(true);
  };

  const handleExtActivityTypeChange = (type: ExtendedActivityType) => {
    setExtActivityType(type);
    const totalMinutes = calculateEarlyDiff(extEndTime, extClosingTime);
    if (type === 'standby') {
      setExtActiveMinutes(0);
      setExtStandbyMinutes(totalMinutes);
    } else {
      setExtActiveMinutes(totalMinutes);
      setExtStandbyMinutes(0);
    }
  };

  const handleSaveExtended = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extEmployeeId) {
      toast.error('Validation error', 'Please select an employee');
      return;
    }
    try {
      await createExtendedAvailability({
        employee_id: extEmployeeId,
        availability_date: extDate,
        regular_closing_time: extClosingTime,
        actual_end_time: extEndTime,
        activity_type: extActivityType,
        active_work_minutes: extActiveMinutes,
        standby_minutes: extStandbyMinutes,
        project_id: extProjectId || undefined,
        reason: extReason,
        approval_status: extStatus,
        admin_remarks: extRemarks,
      });
      toast.success('Extended Availability Recorded', 'Active and standby hours logged');
      setIsExtendedModalOpen(false);
      loadExtensionsData();
    } catch (err: any) {
      toast.error('Failed to record extended hours', err.message);
    }
  };

  const handleDeleteExtended = async (id: string) => {
    if (!confirm('Are you sure you want to delete this extended hours record?')) return;
    try {
      await deleteExtendedAvailability(id);
      toast.success('Deleted', 'Record removed');
      loadExtensionsData();
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  // ==========================================
  // HANDLERS: Weekend Extra Work (Saturday & Sunday)
  // ==========================================
  const openAddWeekendModal = (dayType: WorkDayType = 'saturday') => {
    setExtraEmployeeId(employees[0]?.id || '');
    setExtraWorkDayType(dayType);
    setExtraDate(todayIST());
    setExtraProjectId('');
    setExtraWorkDescription('');
    setExtraStartTime('10:00');
    setExtraEndTime('16:00');
    setExtraStatus('approved');
    setExtraRemarks('');
    setIsWeekendModalOpen(true);
  };

  const handleSaveWeekend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraEmployeeId) {
      toast.error('Validation error', 'Please select an employee');
      return;
    }
    if (!extraWorkDescription.trim()) {
      toast.error('Validation error', 'Please provide a work description');
      return;
    }
    try {
      await createExtraWorkRecord({
        employee_id: extraEmployeeId,
        work_day_type: extraWorkDayType,
        work_date: extraDate,
        project_id: extraProjectId || undefined,
        work_description: extraWorkDescription,
        start_time: extraStartTime,
        end_time: extraEndTime,
        approval_status: extraStatus,
        admin_remarks: extraRemarks,
      });
      toast.success(
        `${extraWorkDayType === 'saturday' ? 'Saturday' : 'Sunday'} Extra Work Recorded`,
        'Weekend work session stored'
      );
      setIsWeekendModalOpen(false);
      loadExtensionsData();
    } catch (err: any) {
      toast.error('Failed to record extra work', err.message);
    }
  };

  const handleDeleteWeekend = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weekend extra work record?')) return;
    try {
      await deleteExtraWorkRecord(id);
      toast.success('Deleted', 'Extra work record removed');
      loadExtensionsData();
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  // ==========================================
  // HANDLERS: Approvals Queue Review
  // ==========================================
  const openReviewModal = (item: {
    type: 'permission' | 'early_logoff' | 'extended' | 'extra_work';
    id: string;
    employeeName: string;
    title: string;
    date: string;
  }) => {
    setApprovalModalItem(item);
    setReviewStatus('approved');
    setReviewRemarks('');
  };

  const handleSaveReview = async () => {
    if (!approvalModalItem) return;
    try {
      if (approvalModalItem.type === 'permission') {
        await updateAttendancePermission(approvalModalItem.id, {
          approval_status: reviewStatus,
          admin_remarks: reviewRemarks || undefined,
        });
      } else if (approvalModalItem.type === 'early_logoff') {
        await updateEarlyLogoff(approvalModalItem.id, {
          approval_status: reviewStatus,
          admin_remarks: reviewRemarks || undefined,
        });
      } else if (approvalModalItem.type === 'extended') {
        await updateExtendedAvailability(approvalModalItem.id, {
          approval_status: reviewStatus,
          admin_remarks: reviewRemarks || undefined,
        });
      } else if (approvalModalItem.type === 'extra_work') {
        await updateExtraWorkRecord(approvalModalItem.id, {
          approval_status: reviewStatus,
          admin_remarks: reviewRemarks || undefined,
        });
      }

      toast.success('Status Updated', `Record marked as ${reviewStatus}`);
      setApprovalModalItem(null);
      loadExtensionsData();
    } catch (err: any) {
      toast.error('Update failed', err.message);
    }
  };

  // Direct quick approve/reject from tables
  const handleQuickStatusChange = async (
    type: 'permission' | 'early_logoff' | 'extended' | 'extra_work',
    id: string,
    status: ApprovalStatus
  ) => {
    try {
      if (type === 'permission') {
        await updateAttendancePermission(id, { approval_status: status });
      } else if (type === 'early_logoff') {
        await updateEarlyLogoff(id, { approval_status: status });
      } else if (type === 'extended') {
        await updateExtendedAvailability(id, { approval_status: status });
      } else if (type === 'extra_work') {
        await updateExtraWorkRecord(id, { approval_status: status });
      }
      toast.success('Status Updated', `Record set to ${status}`);
      loadExtensionsData();
    } catch (err: any) {
      toast.error('Update failed', err.message);
    }
  };

  // Pending Approvals Count across all 4 extensions
  const pendingPermissions = permissions.filter((p) => p.approval_status === 'pending');
  const pendingEarly = earlyLogoffs.filter((e) => e.approval_status === 'pending');
  const pendingExtended = extendedHours.filter((x) => x.approval_status === 'pending');
  const pendingWeekend = extraWork.filter((w) => w.approval_status === 'pending');
  const totalPending =
    pendingPermissions.length +
    pendingEarly.length +
    pendingExtended.length +
    pendingWeekend.length;

  // Filtered weekend work
  const filteredExtraWork = extraWork.filter((w) => {
    if (weekendFilter === 'saturday') return w.work_day_type === 'saturday';
    if (weekendFilter === 'sunday') return w.work_day_type === 'sunday';
    return true;
  });

  const summary = summariseAttendance(records);
  const unrecordedCount = Math.max(0, employees.length - records.length);

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-3">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-primary shadow-xs font-bold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Daily Register
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'permissions'
                ? 'bg-white text-primary shadow-xs font-bold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Half-Day Permissions</span>
            {permissions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-accent text-[10px]">
                {permissions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('early_logoff')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'early_logoff'
                ? 'bg-white text-primary shadow-xs font-bold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Early Log-Off</span>
            {earlyLogoffs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 text-[10px]">
                {earlyLogoffs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('extended_hours')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'extended_hours'
                ? 'bg-white text-primary shadow-xs font-bold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Extended Hours</span>
            {extendedHours.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px]">
                {extendedHours.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('weekend_work')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'weekend_work'
                ? 'bg-white text-primary shadow-xs font-bold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Weekend Extra Work</span>
            {extraWork.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 text-[10px]">
                {extraWork.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'approvals'
                ? 'bg-white text-primary shadow-xs font-bold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Approvals Queue</span>
            {totalPending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                {totalPending}
              </span>
            )}
          </button>
        </div>

        {/* Tab specific top actions */}
        <div>
          {activeTab === 'permissions' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={openAddPermissionModal}
            >
              Add Permission
            </Button>
          )}
          {activeTab === 'early_logoff' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={openAddEarlyLogoffModal}
            >
              Record Early Log-Off
            </Button>
          )}
          {activeTab === 'extended_hours' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={openAddExtendedModal}
            >
              Record Extended Hours
            </Button>
          )}
          {activeTab === 'weekend_work' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => openAddWeekendModal('saturday')}
              >
                + Saturday Work
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => openAddWeekendModal('sunday')}
              >
                + Sunday Work
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUB-TAB 1: DAILY ATTENDANCE REGISTER                         */}
      {/* ============================================================ */}
      {activeTab === 'register' && (
        <div className="space-y-6">
          {/* Header with Date Navigator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary">Daily Attendance Register</h2>
              <p className="text-xs text-secondary mt-0.5">
                Log official arrival & departure times, office hours and leave statuses
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-border rounded-lg shadow-xs p-1">
                <button
                  onClick={() => shiftDate(-1)}
                  className="p-1 hover:bg-gray-100 rounded text-secondary hover:text-primary"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2 py-0.5 text-xs font-semibold text-primary bg-transparent focus:outline-none"
                />

                <button
                  onClick={() => shiftDate(1)}
                  className="p-1 hover:bg-gray-100 rounded text-secondary hover:text-primary"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(todayIST())}
              >
                Today
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={openBulkModal}
                icon={<ListPlus className="w-4 h-4" />}
              >
                Bulk Check-in
              </Button>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              label="Present Today"
              value={summary.present}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="success"
            />
            <MetricCard
              label="Work From Home"
              value={summary.wfh}
              icon={<Users className="w-5 h-5" />}
              color="accent"
            />
            <MetricCard
              label="On Leave"
              value={summary.leave}
              icon={<Calendar className="w-5 h-5" />}
              color="warning"
            />
            <MetricCard
              label="Half Day"
              value={summary.halfDay}
              icon={<Clock className="w-5 h-5" />}
              color="warning"
            />
            <MetricCard
              label="Absent"
              value={summary.absent}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="danger"
            />
            <MetricCard
              label="Unrecorded"
              value={unrecordedCount}
              icon={<Clock className="w-5 h-5" />}
              color={unrecordedCount > 0 ? 'danger' : 'primary'}
              subtitle={unrecordedCount > 0 ? 'Pending check-in' : 'All Recorded'}
            />
          </div>

          {/* Main Attendance Table */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">
                Register for {formatDate(selectedDate)}
              </h3>
              <span className="text-xs text-secondary font-medium">
                {records.length} of {employees.length} team members recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Arrival Time</th>
                    <th className="py-2.5 px-3">Departure Time</th>
                    <th className="py-2.5 px-3">Break</th>
                    <th className="py-2.5 px-3">Office Hours</th>
                    <th className="py-2.5 px-3">Remarks</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.map((emp) => {
                    const record = records.find((r) => r.employee_id === emp.id);

                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/80">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-accent/15 text-accent font-bold text-[10px] flex items-center justify-center">
                              {emp.initials || emp.name.slice(0, 2)}
                            </div>
                            <span className="font-semibold text-primary">{emp.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-secondary">{emp.designation}</td>

                        <td className="py-3 px-3">
                          {record ? (
                            <AttendanceBadge status={record.status} />
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium border border-gray-200">
                              Unrecorded
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-medium text-primary">
                          {formatTime(record?.arrival_time)}
                        </td>

                        <td className="py-3 px-3 font-medium text-primary">
                          {formatTime(record?.departure_time)}
                        </td>

                        <td className="py-3 px-3 text-secondary">
                          {record?.break_duration_minutes ? `${record.break_duration_minutes}m` : '—'}
                        </td>

                        <td className="py-3 px-3 font-bold text-primary">
                          {formatHours(record?.total_hours)}
                        </td>

                        <td className="py-3 px-3 text-secondary max-w-[160px] truncate">
                          {record?.remarks || '—'}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => openSingleModal(emp.id, record)}
                            className="p-1 rounded text-accent hover:bg-indigo-50 font-semibold text-[11px] inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{record ? 'Edit' : 'Record'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 2: HALF-DAY PERMISSIONS                              */}
      {/* ============================================================ */}
      {activeTab === 'permissions' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-primary">Half-Day Permission Records</h3>
              <p className="text-xs text-secondary">
                Track official First-Half and Second-Half permissions, time windows and approval status
              </p>
            </div>
            <span className="text-xs font-semibold text-secondary">
              Total Permissions: {permissions.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Time Window</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Admin Remarks</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {permissions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-secondary">
                      No half-day permission records found. Click "+ Add Permission" to record one.
                    </td>
                  </tr>
                ) : (
                  permissions.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-3 font-semibold text-primary whitespace-nowrap">
                        {formatDate(p.permission_date)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-primary">
                          {p.employee?.name || 'Unknown'}
                        </span>
                        <div className="text-[10px] text-secondary">
                          {p.employee?.designation}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md font-medium text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {HALF_DAY_LABELS[p.half_day_period]}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-primary">
                        {p.start_time.slice(0, 5)} - {p.end_time.slice(0, 5)}
                      </td>
                      <td className="py-3 px-3 font-bold text-accent">
                        {formatMinutes(p.duration_minutes)}
                      </td>
                      <td className="py-3 px-3 text-secondary max-w-[180px] truncate">
                        {p.reason || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <ApprovalBadge status={p.approval_status} />
                      </td>
                      <td className="py-3 px-3 text-secondary max-w-[150px] truncate">
                        {p.admin_remarks || '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.approval_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleQuickStatusChange('permission', p.id, 'approved')}
                                title="Approve"
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleQuickStatusChange('permission', p.id, 'rejected')}
                                title="Reject"
                                className="p-1 rounded text-rose-600 hover:bg-rose-50"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() =>
                              openReviewModal({
                                type: 'permission',
                                id: p.id,
                                employeeName: p.employee?.name || 'Employee',
                                title: `Half-Day Permission (${HALF_DAY_LABELS[p.half_day_period]})`,
                                date: p.permission_date,
                              })
                            }
                            title="Edit Status / Remarks"
                            className="p-1 rounded text-accent hover:bg-indigo-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePermission(p.id)}
                            title="Delete"
                            className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 3: EARLY LOG-OFF                                     */}
      {/* ============================================================ */}
      {activeTab === 'early_logoff' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-primary">Early Log-Off Records</h3>
              <p className="text-xs text-secondary">
                Track employees who departed prior to standard office hours (18:00) without automatic absence marking
              </p>
            </div>
            <span className="text-xs font-semibold text-secondary">
              Total Early Log-Offs: {earlyLogoffs.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Standard Closing</th>
                  <th className="py-2.5 px-3">Actual Departure</th>
                  <th className="py-2.5 px-3">Early Duration</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Admin Remarks</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {earlyLogoffs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-secondary">
                      No early log-off records found. Click "+ Record Early Log-Off" to add one.
                    </td>
                  </tr>
                ) : (
                  earlyLogoffs.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-3 font-semibold text-primary whitespace-nowrap">
                        {formatDate(e.logoff_date)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-primary">
                          {e.employee?.name || 'Unknown'}
                        </span>
                        <div className="text-[10px] text-secondary">
                          {e.employee?.designation}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-secondary">
                        {e.scheduled_departure_time.slice(0, 5)}
                      </td>
                      <td className="py-3 px-3 font-medium text-amber-700">
                        {e.actual_departure_time.slice(0, 5)}
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-600">
                        {formatMinutes(e.difference_minutes)} early
                      </td>
                      <td className="py-3 px-3 text-secondary max-w-[180px] truncate">
                        {e.reason || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <ApprovalBadge status={e.approval_status} />
                      </td>
                      <td className="py-3 px-3 text-secondary max-w-[150px] truncate">
                        {e.admin_remarks || '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {e.approval_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleQuickStatusChange('early_logoff', e.id, 'approved')}
                                title="Approve"
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleQuickStatusChange('early_logoff', e.id, 'rejected')}
                                title="Reject"
                                className="p-1 rounded text-rose-600 hover:bg-rose-50"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() =>
                              openReviewModal({
                                type: 'early_logoff',
                                id: e.id,
                                employeeName: e.employee?.name || 'Employee',
                                title: `Early Log-off (${formatMinutes(e.difference_minutes)} early)`,
                                date: e.logoff_date,
                              })
                            }
                            title="Edit Status / Remarks"
                            className="p-1 rounded text-accent hover:bg-indigo-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEarlyLogoff(e.id)}
                            title="Delete"
                            className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 4: EXTENDED HOURS / LATE AVAILABILITY                */}
      {/* ============================================================ */}
      {activeTab === 'extended_hours' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-primary">
                Late Availability & Extended Working Hours
              </h3>
              <p className="text-xs text-secondary">
                Differentiate active work, client support, meetings and standby availability after regular office hours
              </p>
            </div>
            <span className="text-xs font-semibold text-secondary">
              Total Records: {extendedHours.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Activity Type</th>
                  <th className="py-2.5 px-3">Hours Window</th>
                  <th className="py-2.5 px-3">Active Work</th>
                  <th className="py-2.5 px-3">Standby</th>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {extendedHours.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-secondary">
                      No extended availability records found. Click "+ Record Extended Hours" to add one.
                    </td>
                  </tr>
                ) : (
                  extendedHours.map((x) => (
                    <tr key={x.id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-3 font-semibold text-primary whitespace-nowrap">
                        {formatDate(x.availability_date)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-primary">
                          {x.employee?.name || 'Unknown'}
                        </span>
                        <div className="text-[10px] text-secondary">
                          {x.employee?.designation}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-medium text-[10px] border ${
                            x.activity_type === 'standby'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {EXTENDED_ACTIVITY_LABELS[x.activity_type]}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-secondary">
                        {x.regular_closing_time.slice(0, 5)} - {x.actual_end_time.slice(0, 5)}
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-700">
                        {formatMinutes(x.active_work_minutes)}
                      </td>
                      <td className="py-3 px-3 font-medium text-amber-700">
                        {formatMinutes(x.standby_minutes)}
                      </td>
                      <td className="py-3 px-3 text-secondary max-w-[130px] truncate">
                        {x.project?.name || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <ApprovalBadge status={x.approval_status} />
                      </td>
                      <td className="py-3 px-3 text-secondary max-w-[140px] truncate">
                        {x.reason || x.admin_remarks || '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {x.approval_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleQuickStatusChange('extended', x.id, 'approved')}
                                title="Approve"
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleQuickStatusChange('extended', x.id, 'rejected')}
                                title="Reject"
                                className="p-1 rounded text-rose-600 hover:bg-rose-50"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() =>
                              openReviewModal({
                                type: 'extended',
                                id: x.id,
                                employeeName: x.employee?.name || 'Employee',
                                title: `Extended Hours (${EXTENDED_ACTIVITY_LABELS[x.activity_type]})`,
                                date: x.availability_date,
                              })
                            }
                            title="Edit Status / Remarks"
                            className="p-1 rounded text-accent hover:bg-indigo-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExtended(x.id)}
                            title="Delete"
                            className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 5: WEEKEND EXTRA WORK (SATURDAY & SUNDAY)            */}
      {/* ============================================================ */}
      {activeTab === 'weekend_work' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-primary">Weekend Extra Work Register</h3>
              <p className="text-xs text-secondary">
                Track additional work performed on Saturdays and Sundays, distinct from standard office attendance
              </p>
            </div>

            {/* Filter Pill */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setWeekendFilter('all')}
                className={`px-2.5 py-1 rounded transition-all ${
                  weekendFilter === 'all'
                    ? 'bg-white text-primary shadow-xs font-bold'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                All ({extraWork.length})
              </button>
              <button
                onClick={() => setWeekendFilter('saturday')}
                className={`px-2.5 py-1 rounded transition-all ${
                  weekendFilter === 'saturday'
                    ? 'bg-white text-primary shadow-xs font-bold'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                Saturday ({extraWork.filter((w) => w.work_day_type === 'saturday').length})
              </button>
              <button
                onClick={() => setWeekendFilter('sunday')}
                className={`px-2.5 py-1 rounded transition-all ${
                  weekendFilter === 'sunday'
                    ? 'bg-white text-primary shadow-xs font-bold'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                Sunday ({extraWork.filter((w) => w.work_day_type === 'sunday').length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                  <th className="py-2.5 px-3">Day & Date</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Related Project</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Timing</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Admin Remarks</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExtraWork.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-secondary">
                      No weekend extra work records found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredExtraWork.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              w.work_day_type === 'saturday'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {w.work_day_type}
                          </span>
                          <span className="font-semibold text-primary">
                            {formatDate(w.work_date)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-primary">
                          {w.employee?.name || 'Unknown'}
                        </span>
                        <div className="text-[10px] text-secondary">
                          {w.employee?.designation}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {w.project ? (
                          <span className="font-medium text-accent inline-flex items-center gap-1">
                            <FolderKanban className="w-3 h-3" />
                            {w.project.name}
                          </span>
                        ) : (
                          <span className="text-secondary italic">Standalone</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-primary max-w-[200px] truncate">
                        {w.work_description}
                      </td>
                      <td className="py-3 px-3 text-secondary">
                        {w.start_time.slice(0, 5)} - {w.end_time.slice(0, 5)}
                      </td>
                      <td className="py-3 px-3 font-bold text-primary">
                        {formatMinutes(w.total_minutes)}
                      </td>
                      <td className="py-3 px-3">
                        <ApprovalBadge status={w.approval_status} />
                      </td>
                      <td className="py-3 px-3 text-secondary max-w-[140px] truncate">
                        {w.admin_remarks || '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {w.approval_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleQuickStatusChange('extra_work', w.id, 'approved')}
                                title="Approve"
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleQuickStatusChange('extra_work', w.id, 'rejected')}
                                title="Reject"
                                className="p-1 rounded text-rose-600 hover:bg-rose-50"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() =>
                              openReviewModal({
                                type: 'extra_work',
                                id: w.id,
                                employeeName: w.employee?.name || 'Employee',
                                title: `${w.work_day_type === 'saturday' ? 'Saturday' : 'Sunday'} Extra Work`,
                                date: w.work_date,
                              })
                            }
                            title="Edit Status / Remarks"
                            className="p-1 rounded text-accent hover:bg-indigo-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWeekend(w.id)}
                            title="Delete"
                            className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 6: CONSOLIDATED APPROVALS QUEUE                      */}
      {/* ============================================================ */}
      {activeTab === 'approvals' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-accent" />
                <span>Pending Approvals Queue</span>
              </h3>
              <p className="text-xs text-secondary">
                Consolidated workflow for permissions, early departures, late availability and weekend work awaiting Design Lead authorization
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {totalPending} Action Items Pending
            </span>
          </div>

          {totalPending === 0 ? (
            <div className="py-12 text-center text-xs text-secondary space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="font-semibold text-primary">All Approvals Up to Date</div>
              <p>There are no pending attendance permissions, early departures or extra work records.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 1. Pending Permissions */}
              {pendingPermissions.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-indigo-100 bg-indigo-50/30 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">
                        Half-Day Permission
                      </span>
                      <span className="font-bold text-primary">{p.employee?.name}</span>
                      <span className="text-secondary font-medium">({formatDate(p.permission_date)})</span>
                    </div>
                    <div className="text-secondary">
                      <span className="font-semibold text-primary">
                        {HALF_DAY_LABELS[p.half_day_period]}
                      </span>{' '}
                      • {p.start_time.slice(0, 5)} to {p.end_time.slice(0, 5)} (
                      {formatMinutes(p.duration_minutes)})
                      {p.reason && <span className="ml-2 italic text-gray-600">— Reason: "{p.reason}"</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatusChange('permission', p.id, 'rejected')}
                      icon={<X className="w-3.5 h-3.5 text-rose-600" />}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickStatusChange('permission', p.id, 'approved')}
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}

              {/* 2. Pending Early Log-offs */}
              {pendingEarly.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-amber-100 bg-amber-50/30 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        Early Log-Off
                      </span>
                      <span className="font-bold text-primary">{e.employee?.name}</span>
                      <span className="text-secondary font-medium">({formatDate(e.logoff_date)})</span>
                    </div>
                    <div className="text-secondary">
                      Departed at <span className="font-semibold text-primary">{e.actual_departure_time.slice(0, 5)}</span>{' '}
                      (Standard: {e.scheduled_departure_time.slice(0, 5)}) •{' '}
                      <span className="font-bold text-amber-700">
                        {formatMinutes(e.difference_minutes)} early
                      </span>
                      {e.reason && <span className="ml-2 italic text-gray-600">— Reason: "{e.reason}"</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatusChange('early_logoff', e.id, 'rejected')}
                      icon={<X className="w-3.5 h-3.5 text-rose-600" />}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickStatusChange('early_logoff', e.id, 'approved')}
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}

              {/* 3. Pending Extended Hours */}
              {pendingExtended.map((x) => (
                <div
                  key={x.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50/30 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        Extended Hours ({EXTENDED_ACTIVITY_LABELS[x.activity_type]})
                      </span>
                      <span className="font-bold text-primary">{x.employee?.name}</span>
                      <span className="text-secondary font-medium">({formatDate(x.availability_date)})</span>
                    </div>
                    <div className="text-secondary">
                      Until <span className="font-semibold text-primary">{x.actual_end_time.slice(0, 5)}</span> • Active:{' '}
                      <span className="font-bold text-blue-700">{formatMinutes(x.active_work_minutes)}</span> | Standby:{' '}
                      <span className="font-bold text-amber-700">{formatMinutes(x.standby_minutes)}</span>
                      {x.project?.name && (
                        <span className="ml-2 text-indigo-700 font-semibold">• Project: {x.project.name}</span>
                      )}
                      {x.reason && <span className="ml-2 italic text-gray-600">— "{x.reason}"</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatusChange('extended', x.id, 'rejected')}
                      icon={<X className="w-3.5 h-3.5 text-rose-600" />}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickStatusChange('extended', x.id, 'approved')}
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}

              {/* 4. Pending Weekend Extra Work */}
              {pendingWeekend.map((w) => (
                <div
                  key={w.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-purple-100 bg-purple-50/30 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                        {w.work_day_type} Extra Work
                      </span>
                      <span className="font-bold text-primary">{w.employee?.name}</span>
                      <span className="text-secondary font-medium">({formatDate(w.work_date)})</span>
                    </div>
                    <div className="text-secondary">
                      {w.work_description} • {w.start_time.slice(0, 5)} to {w.end_time.slice(0, 5)} (
                      <span className="font-bold text-purple-700">{formatMinutes(w.total_minutes)}</span>)
                      {w.project?.name && (
                        <span className="ml-2 text-indigo-700 font-semibold">• Project: {w.project.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatusChange('extra_work', w.id, 'rejected')}
                      icon={<X className="w-3.5 h-3.5 text-rose-600" />}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickStatusChange('extra_work', w.id, 'approved')}
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: SINGLE DAILY ATTENDANCE                             */}
      {/* ============================================================ */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title={editingRecord ? 'Correct Attendance' : 'Record Attendance'}
        subtitle={`Date: ${formatDate(selectedDate)}`}
        size="md"
      >
        <form onSubmit={handleSaveSingle} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Team Member *
            </label>
            <select
              value={formEmployeeId}
              onChange={(e) => setFormEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.designation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Attendance Status *
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as AttendanceStatus)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="present">Present (In Office)</option>
              <option value="work_from_home">Work From Home (WFH)</option>
              <option value="half_day">Half Day</option>
              <option value="leave">Leave (Approved)</option>
              <option value="absent">Absent</option>
              <option value="holiday">Holiday</option>
              <option value="weekly_off">Weekly Off</option>
            </select>
          </div>

          {(formStatus === 'present' || formStatus === 'half_day' || formStatus === 'work_from_home') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-primary uppercase mb-1">
                    Arrival Time
                  </label>
                  <input
                    type="time"
                    value={formArrival}
                    onChange={(e) => setFormArrival(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary uppercase mb-1">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    value={formDeparture}
                    onChange={(e) => setFormDeparture(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase mb-1">
                  Break Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={formBreak}
                  onChange={(e) => setFormBreak(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Remarks / Justification
            </label>
            <input
              value={formRemarks}
              onChange={(e) => setFormRemarks(e.target.value)}
              placeholder="e.g. Arrived late due to client visit..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRecordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Attendance
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 2: BULK ATTENDANCE                                     */}
      {/* ============================================================ */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Attendance Check-in"
        subtitle={`Apply attendance for all ${employees.length} team members on ${formatDate(selectedDate)}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
            <span className="text-xs text-indigo-900 font-medium">
              Quick Action: Mark all active members as Present (09:00 - 18:00)
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setBulkEntries((prev) =>
                  prev.map((e) => ({
                    ...e,
                    status: 'present',
                    arrival: '09:00',
                    departure: '18:00',
                    breakMinutes: 60,
                  }))
                );
              }}
            >
              Set All Present
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {bulkEntries.map((entry, idx) => (
              <div
                key={entry.employee_id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-gray-50/40 text-xs"
              >
                <span className="font-semibold text-primary w-32 truncate">{entry.name}</span>

                <select
                  value={entry.status}
                  onChange={(e) => {
                    const updated = [...bulkEntries];
                    updated[idx].status = e.target.value as AttendanceStatus;
                    setBulkEntries(updated);
                  }}
                  className="px-2 py-1 bg-white border border-border rounded focus:outline-none text-xs"
                >
                  <option value="present">Present</option>
                  <option value="work_from_home">WFH</option>
                  <option value="half_day">Half Day</option>
                  <option value="leave">Leave</option>
                  <option value="absent">Absent</option>
                  <option value="holiday">Holiday</option>
                  <option value="weekly_off">Weekly Off</option>
                </select>

                <input
                  type="time"
                  value={entry.arrival}
                  disabled={entry.status === 'leave' || entry.status === 'absent'}
                  onChange={(e) => {
                    const updated = [...bulkEntries];
                    updated[idx].arrival = e.target.value;
                    setBulkEntries(updated);
                  }}
                  className="px-2 py-1 bg-white border border-border rounded text-xs w-24 disabled:bg-gray-100"
                />

                <input
                  type="time"
                  value={entry.departure}
                  disabled={entry.status === 'leave' || entry.status === 'absent'}
                  onChange={(e) => {
                    const updated = [...bulkEntries];
                    updated[idx].departure = e.target.value;
                    setBulkEntries(updated);
                  }}
                  className="px-2 py-1 bg-white border border-border rounded text-xs w-24 disabled:bg-gray-100"
                />

                <span className="text-[11px] text-secondary font-medium ml-auto">
                  {entry.status === 'present' || entry.status === 'work_from_home'
                    ? `${calculateOfficeHours(entry.arrival, entry.departure, entry.breakMinutes).toFixed(1)}h`
                    : '—'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsBulkModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveBulk}>
              Save All Attendance
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 3: ADD HALF-DAY PERMISSION                             */}
      {/* ============================================================ */}
      <Modal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        title="Record Half-Day Permission"
        subtitle="Log authorized first-half or second-half absence window"
        size="md"
      >
        <form onSubmit={handleSavePermission} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Employee *
            </label>
            <select
              value={permEmployeeId}
              onChange={(e) => setPermEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              required
            >
              <option value="">Select Employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.designation}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Permission Date *
              </label>
              <input
                type="date"
                value={permDate}
                onChange={(e) => setPermDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Half-Day Period *
              </label>
              <select
                value={permPeriod}
                onChange={(e) => handlePeriodChange(e.target.value as HalfDayPeriod)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="first_half">First Half (Morning)</option>
                <option value="second_half">Second Half (Afternoon)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={permStart}
                onChange={(e) => setPermStart(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={permEnd}
                onChange={(e) => setPermEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Approval Status
              </label>
              <select
                value={permStatus}
                onChange={(e) => setPermStatus(e.target.value as ApprovalStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Calculated Duration
              </label>
              <div className="px-3 py-2 text-sm bg-gray-50 border border-border rounded-lg text-primary font-bold">
                {formatMinutes(calculateEarlyDiff(permEnd, permStart))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Reason
            </label>
            <input
              type="text"
              value={permReason}
              onChange={(e) => setPermReason(e.target.value)}
              placeholder="e.g. Doctor appointment, family function, bank work..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Admin Remarks
            </label>
            <input
              type="text"
              value={permRemarks}
              onChange={(e) => setPermRemarks(e.target.value)}
              placeholder="Optional notes or condition..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPermissionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Permission
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 4: RECORD EARLY LOG-OFF                                */}
      {/* ============================================================ */}
      <Modal
        isOpen={isEarlyModalOpen}
        onClose={() => setIsEarlyModalOpen(false)}
        title="Record Early Log-Off"
        subtitle="Log early departure without affecting daily presence or leave count"
        size="md"
      >
        <form onSubmit={handleSaveEarlyLogoff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Employee *
            </label>
            <select
              value={earlyEmployeeId}
              onChange={(e) => setEarlyEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              required
            >
              <option value="">Select Employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.designation}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Date *
              </label>
              <input
                type="date"
                value={earlyDate}
                onChange={(e) => setEarlyDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Approval Status
              </label>
              <select
                value={earlyStatus}
                onChange={(e) => setEarlyStatus(e.target.value as ApprovalStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Standard Closing Time
              </label>
              <input
                type="time"
                value={earlyScheduledTime}
                onChange={(e) => setEarlyScheduledTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Actual Departure Time *
              </label>
              <input
                type="time"
                value={earlyActualTime}
                onChange={(e) => setEarlyActualTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Early Departure Difference
            </label>
            <div className="px-3 py-2 text-sm bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-bold">
              {formatMinutes(calculateEarlyDiff(earlyScheduledTime, earlyActualTime))} early
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Reason for Leaving Early
            </label>
            <input
              type="text"
              value={earlyReason}
              onChange={(e) => setEarlyReason(e.target.value)}
              placeholder="e.g. Completed milestone early, personal emergency..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Admin Remarks
            </label>
            <input
              type="text"
              value={earlyRemarks}
              onChange={(e) => setEarlyRemarks(e.target.value)}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEarlyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Early Log-Off
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 5: RECORD EXTENDED HOURS / LATE AVAILABILITY           */}
      {/* ============================================================ */}
      <Modal
        isOpen={isExtendedModalOpen}
        onClose={() => setIsExtendedModalOpen(false)}
        title="Record Extended Hours / Late Availability"
        subtitle="Log work or standby presence after regular 18:00 office closing"
        size="md"
      >
        <form onSubmit={handleSaveExtended} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Employee *
            </label>
            <select
              value={extEmployeeId}
              onChange={(e) => setExtEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              required
            >
              <option value="">Select Employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.designation}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Date *
              </label>
              <input
                type="date"
                value={extDate}
                onChange={(e) => setExtDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Activity Type *
              </label>
              <select
                value={extActivityType}
                onChange={(e) => handleExtActivityTypeChange(e.target.value as ExtendedActivityType)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="active_work">Active Work</option>
                <option value="client_support">Client Support</option>
                <option value="meeting">Meeting</option>
                <option value="standby">Standby / Availability</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Standard Closing (IST)
              </label>
              <input
                type="time"
                value={extClosingTime}
                onChange={(e) => setExtClosingTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Actual Availability End *
              </label>
              <input
                type="time"
                value={extEndTime}
                onChange={(e) => {
                  setExtEndTime(e.target.value);
                  const diff = calculateEarlyDiff(e.target.value, extClosingTime);
                  if (extActivityType === 'standby') {
                    setExtStandbyMinutes(diff);
                    setExtActiveMinutes(0);
                  } else {
                    setExtActiveMinutes(diff);
                    setExtStandbyMinutes(0);
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Active Work Minutes
              </label>
              <input
                type="number"
                min="0"
                step="15"
                value={extActiveMinutes}
                onChange={(e) => setExtActiveMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Standby Minutes
              </label>
              <input
                type="number"
                min="0"
                step="15"
                value={extStandbyMinutes}
                onChange={(e) => setExtStandbyMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Related Project (Optional)
              </label>
              <select
                value={extProjectId}
                onChange={(e) => setExtProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">None / General Availability</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Approval Status
              </label>
              <select
                value={extStatus}
                onChange={(e) => setExtStatus(e.target.value as ApprovalStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Reason / Activity Detail
            </label>
            <input
              type="text"
              value={extReason}
              onChange={(e) => setExtReason(e.target.value)}
              placeholder="e.g. Urgent deployment release, client demo call..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Admin Remarks
            </label>
            <input
              type="text"
              value={extRemarks}
              onChange={(e) => setExtRemarks(e.target.value)}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsExtendedModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Extended Hours
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 6: RECORD WEEKEND EXTRA WORK                           */}
      {/* ============================================================ */}
      <Modal
        isOpen={isWeekendModalOpen}
        onClose={() => setIsWeekendModalOpen(false)}
        title={`Record ${extraWorkDayType === 'saturday' ? 'Saturday' : 'Sunday'} Extra Work`}
        subtitle="Log weekend project delivery session or standalone support"
        size="md"
      >
        <form onSubmit={handleSaveWeekend} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Day Type *
              </label>
              <select
                value={extraWorkDayType}
                onChange={(e) => setExtraWorkDayType(e.target.value as WorkDayType)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Work Date *
              </label>
              <input
                type="date"
                value={extraDate}
                onChange={(e) => setExtraDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Employee *
            </label>
            <select
              value={extraEmployeeId}
              onChange={(e) => setExtraEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              required
            >
              <option value="">Select Employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.designation}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Related Project (Optional)
              </label>
              <select
                value={extraProjectId}
                onChange={(e) => setExtraProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Standalone Work (No Project)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Approval Status
              </label>
              <select
                value={extraStatus}
                onChange={(e) => setExtraStatus(e.target.value as ApprovalStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={extraStartTime}
                onChange={(e) => setExtraStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={extraEndTime}
                onChange={(e) => setExtraEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Calculated Duration
            </label>
            <div className="px-3 py-2 text-sm bg-purple-50 border border-purple-200 rounded-lg text-purple-900 font-bold">
              {formatMinutes(calculateEarlyDiff(extraEndTime, extraStartTime))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Work Description *
            </label>
            <textarea
              rows={2}
              value={extraWorkDescription}
              onChange={(e) => setExtraWorkDescription(e.target.value)}
              placeholder="Detail specific deliverables completed during weekend..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Admin Remarks
            </label>
            <input
              type="text"
              value={extraRemarks}
              onChange={(e) => setExtraRemarks(e.target.value)}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsWeekendModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Extra Work
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 7: REVIEW APPROVAL STATUS / REMARKS                    */}
      {/* ============================================================ */}
      {approvalModalItem && (
        <Modal
          isOpen={true}
          onClose={() => setApprovalModalItem(null)}
          title="Review Authorization & Remarks"
          subtitle={`${approvalModalItem.title} for ${approvalModalItem.employeeName}`}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Authorization Status
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as ApprovalStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Admin Remarks
              </label>
              <textarea
                rows={3}
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="Add audit justification or notes..."
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setApprovalModalItem(null)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveReview}>
                Save Decision
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
