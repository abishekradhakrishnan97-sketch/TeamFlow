import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { StatusBadge, PriorityBadge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  getProjects,
  createProject,
  getWorkflowTemplates,
} from '@/services/supabase/projects';
import { getEmployees } from '@/services/supabase/employees';
import {
  Project,
  Employee,
  WorkflowTemplate,
  ProjectType,
  Priority,
  ProjectStatus,
  PROJECT_TYPE_LABELS,
} from '@/types';
import { formatDate } from '@/utils/dates';
import { useToast } from '@/store/useAppStore';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // New Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    client_name: string;
    description: string;
    project_type: ProjectType;
    custom_type: string;
    priority: Priority;
    status: ProjectStatus;
    start_date: string;
    target_delivery_date: string;
    owner_id: string;
    workflow_template_id: string;
    notes: string;
    selectedMembers: string[];
  }>({
    name: '',
    client_name: '',
    description: '',
    project_type: 'existing_product_redesign',
    custom_type: '',
    priority: 'medium',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    target_delivery_date: '',
    owner_id: '',
    workflow_template_id: '',
    notes: '',
    selectedMembers: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [p, e, w] = await Promise.all([
        getProjects({ includeArchived: false }),
        getEmployees(),
        getWorkflowTemplates(),
      ]);
      setProjects(p);
      setEmployees(e);
      setWorkflows(w);
    } catch (err) {
      console.error(err);
      toast.error('Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Validation Error', 'Project name is required');
      return;
    }

    try {
      setFormLoading(true);
      const newProj = await createProject(
        {
          name: formData.name,
          client_name: formData.client_name || undefined,
          description: formData.description || undefined,
          project_type: formData.project_type,
          custom_type: formData.custom_type || undefined,
          priority: formData.priority,
          status: formData.status,
          start_date: formData.start_date || undefined,
          target_delivery_date: formData.target_delivery_date || undefined,
          owner_id: formData.owner_id || undefined,
          workflow_template_id: formData.workflow_template_id || undefined,
          notes: formData.notes || undefined,
          is_quick_request: false,
        },
        formData.selectedMembers
      );

      toast.success('Project Created', `Project "${newProj.name}" created successfully`);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Creation Failed', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.project_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchClient = p.client_name?.toLowerCase().includes(q);
      if (!matchName && !matchClient) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">All Projects</h2>
          <p className="text-xs text-secondary mt-0.5">
            Manage projects, multidisciplinary teams, workflows and deadlines
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by project name or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="under_review">Under Review</option>
            <option value="on_hold">On Hold</option>
            <option value="delivered">Delivered</option>
            <option value="reopened">Reopened</option>
            <option value="not_started">Not Started</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Project Types</option>
            {Object.entries(PROJECT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="p-5 flex flex-col justify-between hover:shadow-lg transition-all border border-border"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
              </div>

              <h3 className="text-base font-bold text-primary mt-3 hover:text-accent transition-colors line-clamp-1">
                {project.name}
              </h3>

              {project.client_name && (
                <p className="text-xs font-medium text-accent mt-0.5">
                  Client: {project.client_name}
                </p>
              )}

              <p className="text-xs text-secondary mt-2 line-clamp-2">
                {project.description || 'No description provided.'}
              </p>

              <div className="mt-4 pt-3 border-t border-border flex flex-col gap-1.5 text-xs text-secondary">
                <div className="flex items-center justify-between">
                  <span>Type:</span>
                  <span className="font-medium text-primary text-[11px] truncate max-w-[170px]">
                    {PROJECT_TYPE_LABELS[project.project_type] || project.project_type}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Target Date:</span>
                  <span className="font-medium text-primary text-[11px]">
                    {formatDate(project.target_delivery_date)}
                  </span>
                </div>
              </div>
            </div>

            {/* Members Footer */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <div className="flex -space-x-1.5 overflow-hidden">
                {project.members && project.members.length > 0 ? (
                  project.members.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      title={m.employee?.name}
                      className="inline-block w-6 h-6 rounded-full ring-2 ring-white bg-accent/20 text-accent font-bold text-[9px] flex items-center justify-center"
                    >
                      {m.employee?.initials || m.employee?.name?.slice(0, 2)}
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-gray-400 italic">No assigned members</span>
                )}
                {project.members && project.members.length > 4 && (
                  <div className="w-6 h-6 rounded-full ring-2 ring-white bg-gray-200 text-gray-600 font-bold text-[9px] flex items-center justify-center">
                    +{project.members.length - 4}
                  </div>
                )}
              </div>

              <span className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1">
                Open Details →
              </span>
            </div>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && !loading && (
        <EmptyState
          icon={<FolderKanban className="w-8 h-8" />}
          title="No projects found"
          description="Create your first design project or adjust the search and filter criteria."
          actionLabel="Create Project"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* CREATE PROJECT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        subtitle="Set up project details, client, workflow, and multidisciplinary assignments"
        size="xl"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Project Name *
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. RelayVoice Mobile App Redesign"
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Client / Organization Name
              </label>
              <input
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="e.g. Acme Corp"
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Project Type
              </label>
              <select
                value={formData.project_type}
                onChange={(e) =>
                  setFormData({ ...formData, project_type: e.target.value as ProjectType })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {Object.entries(PROJECT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as Priority })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ProjectStatus })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="active">Active</option>
                <option value="not_started">Not Started</option>
                <option value="on_hold">On Hold</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Target Delivery Date
              </label>
              <input
                type="date"
                value={formData.target_delivery_date}
                onChange={(e) =>
                  setFormData({ ...formData, target_delivery_date: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Workflow Template & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Workflow Template
              </label>
              <select
                value={formData.workflow_template_id}
                onChange={(e) =>
                  setFormData({ ...formData, workflow_template_id: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Default Workflow (Initiation → Design → Dev...)</option>
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Project Owner / Lead
              </label>
              <select
                value={formData.owner_id}
                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- Design Lead (Default) --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.designation}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assign Team Members (Multi-select) */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
              Assigned Team Members ({formData.selectedMembers.length} selected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 border border-border rounded-lg bg-gray-50/50">
              {employees.map((emp) => {
                const isSelected = formData.selectedMembers.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs ${
                      isSelected ? 'bg-indigo-50 text-accent font-semibold' : 'hover:bg-gray-100 text-primary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            selectedMembers: [...formData.selectedMembers, emp.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            selectedMembers: formData.selectedMembers.filter((id) => id !== emp.id),
                          });
                        }
                      }}
                      className="rounded text-accent focus:ring-accent"
                    />
                    <span className="truncate">{emp.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Description & Objectives
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Scope, deliverable expectations and key project guidelines..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

