import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
} from '@/services/supabase/employees';
import { Employee, Department } from '@/types';
import { formatDate } from '@/utils/dates';
import { useToast } from '@/store/useAppStore';
import { Users, Plus, Search, Edit2, UserX, Phone, Mail, ArrowRight } from 'lucide-react';

export const Team: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    designation: string;
    department_id: string;
    initials: string;
    joining_date: string;
    status: 'active' | 'inactive';
    email: string;
    phone: string;
    notes: string;
  }>({
    name: '',
    designation: '',
    department_id: '',
    initials: '',
    joining_date: '',
    status: 'active',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const [e, d] = await Promise.all([getEmployees(true), getDepartments()]);
      setEmployees(e);
      setDepartments(d);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingEmp(null);
    setFormData({
      name: '',
      designation: '',
      department_id: departments[0]?.id || '',
      initials: '',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'active',
      email: '',
      phone: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEmp(emp);
    setFormData({
      name: emp.name,
      designation: emp.designation,
      department_id: emp.department_id || '',
      initials: emp.initials || '',
      joining_date: emp.joining_date || '',
      status: emp.status,
      email: emp.email || '',
      phone: emp.phone || '',
      notes: emp.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.designation) {
      toast.error('Validation Error', 'Name and designation are required');
      return;
    }

    const computedInitials =
      formData.initials ||
      formData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    try {
      if (editingEmp) {
        await updateEmployee(editingEmp.id, {
          name: formData.name,
          designation: formData.designation,
          department_id: formData.department_id || undefined,
          initials: computedInitials,
          joining_date: formData.joining_date || undefined,
          status: formData.status,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          notes: formData.notes || undefined,
        });
        toast.success('Employee Updated', `Updated profile for ${formData.name}`);
      } else {
        await createEmployee({
          name: formData.name,
          designation: formData.designation,
          department_id: formData.department_id || undefined,
          initials: computedInitials,
          joining_date: formData.joining_date || undefined,
          status: formData.status,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          notes: formData.notes || undefined,
        });
        toast.success('Employee Added', `Added ${formData.name} to the team`);
      }

      setIsModalOpen(false);
      loadTeam();
    } catch (err: any) {
      toast.error('Error saving employee', err.message);
    }
  };

  const handleToggleStatus = async (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    try {
      await updateEmployee(emp.id, { status: newStatus });
      toast.success(
        `Employee ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`,
        `${emp.name} is now ${newStatus}`
      );
      loadTeam();
    } catch (err: any) {
      toast.error('Status update failed', err.message);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
    if (deptFilter !== 'all' && emp.department_id !== deptFilter) return false;
    if (
      search &&
      !emp.name.toLowerCase().includes(search.toLowerCase()) &&
      !emp.designation.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Team Directory</h2>
          <p className="text-xs text-secondary mt-0.5">
            Manage multidisciplinary design, development and creative staff
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openCreateModal}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Team Member
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search team member or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredEmployees.map((emp) => (
          <Card
            key={emp.id}
            onClick={() => navigate(`/team/${emp.id}`)}
            className="p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent font-bold text-base flex items-center justify-center border border-accent/20">
                  {emp.initials || emp.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => openEditModal(emp, e)}
                    title="Edit Employee"
                    className="p-1 rounded-md text-gray-400 hover:text-accent hover:bg-gray-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleToggleStatus(emp, e)}
                    title={emp.status === 'active' ? 'Deactivate' : 'Activate'}
                    className={`p-1 rounded-md ${
                      emp.status === 'active'
                        ? 'text-gray-400 hover:text-danger'
                        : 'text-success hover:bg-emerald-50'
                    } hover:bg-gray-100`}
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-sm text-primary group-hover:text-accent transition-colors">
                {emp.name}
              </h3>
              <p className="text-xs text-secondary font-medium mt-0.5">{emp.designation}</p>

              {emp.department && (
                <div className="mt-2.5">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-semibold border border-gray-200">
                    {emp.department.name}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-secondary">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                  emp.status === 'active' ? 'text-success' : 'text-gray-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    emp.status === 'active' ? 'bg-success' : 'bg-gray-400'
                  }`}
                />
                {emp.status === 'active' ? 'Active' : 'Inactive'}
              </span>

              <span className="text-[11px] font-semibold text-accent flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Profile →
              </span>
            </div>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && !loading && (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No team members match criteria"
          description="Adjust your search or filter to see team members."
        />
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmp ? 'Edit Team Member' : 'Add Team Member'}
        size="md"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Full Name *
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Akash"
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Initials (2 letters)
              </label>
              <input
                maxLength={3}
                value={formData.initials}
                onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase() })}
                placeholder="AK"
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Designation *
            </label>
            <input
              required
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g. Graphic & UI Designer"
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Department
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- None --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="akash@team.com"
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Phone (Optional)
              </label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Joining Date
            </label>
            <input
              type="date"
              value={formData.joining_date}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Internal Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Skills, preferences, equipment notes..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
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
              {editingEmp ? 'Save Changes' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

