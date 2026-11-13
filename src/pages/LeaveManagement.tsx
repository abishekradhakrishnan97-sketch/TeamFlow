import React, { useState, useEffect } from 'react';
import { Card, MetricCard } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  getLeaveRecords,
  createLeaveRecord,
  updateLeaveRecord,
  deleteLeaveRecord,
} from '@/services/supabase/leave';
import { getEmployees } from '@/services/supabase/employees';
import { LeaveRecord, Employee, LeaveCategory, LeaveApprovalStatus } from '@/types';
import { formatDate } from '@/utils/dates';
import { useToast } from '@/store/useAppStore';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Trash2,
  Filter,
} from 'lucide-react';

const LEAVE_CATEGORIES: { value: LeaveCategory; label: string }[] = [
  { value: 'casual_leave', label: 'Casual Leave' },
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'planned_leave', label: 'Planned Leave' },
  { value: 'emergency_leave', label: 'Emergency Leave' },
  { value: 'half_day_leave', label: 'Half-day Leave' },
  { value: 'unpaid_leave', label: 'Unpaid Leave' },
  { value: 'work_from_home', label: 'Work From Home' },
  { value: 'other', label: 'Other' },
];

export const LeaveManagement: React.FC = () => {
  const toast = useToast();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    employee_id: string;
    category: LeaveCategory;
    start_date: string;
    end_date: string;
    num_days: number;
    reason: string;
    approval_status: LeaveApprovalStatus;
    remarks: string;
  }>({
    employee_id: '',
    category: 'casual_leave',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    num_days: 1,
    reason: '',
    approval_status: 'approved',
    remarks: '',
  });

  const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [l, e] = await Promise.all([getLeaveRecords(), getEmployees()]);
      setLeaves(l);
      setEmployees(e);
      if (e.length > 0 && !formData.employee_id) {
        setFormData((prev) => ({ ...prev, employee_id: e[0].id }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.start_date || !formData.end_date) {
      toast.error('Validation Error', 'Please complete all required fields');
      return;
    }

    try {
      await createLeaveRecord(formData);
      toast.success('Leave Recorded', 'Leave registered and approved');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Failed to record leave', err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteLeaveId) return;
    try {
      await deleteLeaveRecord(deleteLeaveId);
      toast.success('Leave Record Deleted');
      setDeleteLeaveId(null);
      loadData();
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  // Metrics
  const approvedLeaves = leaves.filter((l) => l.approval_status === 'approved');
  const totalDays = approvedLeaves.reduce((sum, l) => sum + Number(l.num_days || 0), 0);
  const sickLeaves = approvedLeaves.filter((l) => l.category === 'sick_leave').length;
  const casualLeaves = approvedLeaves.filter((l) => l.category === 'casual_leave').length;
  const plannedLeaves = approvedLeaves.filter((l) => l.category === 'planned_leave').length;

  const filteredLeaves = leaves.filter((l) => {
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
    if (employeeFilter !== 'all' && l.employee_id !== employeeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Leave Register</h2>
          <p className="text-xs text-secondary mt-0.5">
            Log and track planned leaves, sick days, WFH and emergency absences
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Record Leave
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Leave Days"
          value={`${totalDays}d`}
          icon={<CalendarDays className="w-5 h-5" />}
          color="accent"
          subtitle="All approved leaves"
        />
        <MetricCard
          label="Casual Leaves"
          value={casualLeaves}
          icon={<Calendar className="w-5 h-5" />}
          color="primary"
        />
        <MetricCard
          label="Sick Leaves"
          value={sickLeaves}
          icon={<AlertCircle className="w-5 h-5" />}
          color="warning"
        />
        <MetricCard
          label="Planned Leaves"
          value={plannedLeaves}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
        />
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Team Members</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Categories</option>
            {LEAVE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Leave Table */}
      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Date Range</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Approval</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeaves.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/80">
                  <td className="py-3 px-3 font-semibold text-primary">{l.employee?.name}</td>
                  <td className="py-3 px-3 font-medium capitalize">
                    {l.category.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-3 text-secondary">
                    {formatDate(l.start_date)} → {formatDate(l.end_date)}
                  </td>
                  <td className="py-3 px-3 font-bold text-primary">{l.num_days} days</td>
                  <td className="py-3 px-3 text-secondary max-w-[200px] truncate">
                    {l.reason || '—'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-success text-[10px] font-semibold border border-emerald-200 uppercase">
                      {l.approval_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setDeleteLeaveId(l.id)}
                      title="Delete Record"
                      className="p-1 rounded text-gray-400 hover:text-danger hover:bg-gray-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLeaves.length === 0 && (
            <EmptyState
              icon={<CalendarDays className="w-8 h-8" />}
              title="No leave records found"
              description="Record approved leaves and absences for team members."
              actionLabel="Record Leave"
              onAction={() => setIsModalOpen(true)}
            />
          )}
        </div>
      </Card>

      {/* RECORD LEAVE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Employee Leave"
        subtitle="Approved leave records are preserved separately from unexcused absence"
        size="md"
      >
        <form onSubmit={handleCreateLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Employee *
            </label>
            <select
              required
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as LeaveCategory })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {LEAVE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Days Count *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.num_days}
                onChange={(e) => setFormData({ ...formData, num_days: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Reason / Explanation
            </label>
            <input
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Medical emergency / Planned vacation..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Leave
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteLeaveId)}
        title="Delete Leave Record"
        message="Are you sure you want to delete this leave entry?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteLeaveId(null)}
      />
    </div>
  );
};

