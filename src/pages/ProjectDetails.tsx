import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { StatusBadge, PriorityBadge } from '@/components/shared/Badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { supabase } from '@/services/supabase/client';
import {
  getProjectById,
  updateProject,
  archiveProject,
  reopenProject,
  getWorkstreams,
  createWorkstream,
} from '@/services/supabase/projects';
import { getTasks, createTask, updateTaskStatus } from '@/services/supabase/tasks';
import {
  getRevisions,
  createRevision,
  getDeliveries,
  recordDelivery,
} from '@/services/supabase/revisions';
import { getActivityEvents } from '@/services/supabase/activity';
import { getEmployees } from '@/services/supabase/employees';
import {
  getExtraWorkRecords,
  getExtendedAvailability,
} from '@/services/supabase/attendanceExtensions';
import { ApprovalBadge } from '@/components/shared/Badge';
import { formatMinutes } from '@/utils/calculations';
import {
  Project,
  Task,
  Revision,
  DeliveryRecord,
  ActivityEvent,
  Workstream,
  Employee,
  ExtraWorkRecord,
  ExtendedAvailability,
  PROJECT_TYPE_LABELS,
  EXTENDED_ACTIVITY_LABELS,
  TaskStatus,
} from '@/types';
import { formatDate, formatDateTime, getRelativeTime } from '@/utils/dates';
import { useToast } from '@/store/useAppStore';
import {
  ArrowLeft,
  Calendar,
  Layers,
  History,
  CheckCircle2,
  PackageCheck,
  Plus,
  Archive,
  RotateCcw,
  Users,
} from 'lucide-react';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [workstreams, setWorkstreams] = useState<Workstream[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [extraWorkRecords, setExtraWorkRecords] = useState<ExtraWorkRecord[]>([]);
  const [extendedRecords, setExtendedRecords] = useState<ExtendedAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  // Active tab: Overview | Tasks | Extra Work | Revisions | Deliveries | Activity
  const [activeTab, setActiveTab] = useState<
    'overview' | 'tasks' | 'extra_work' | 'revisions' | 'deliveries' | 'activity'
  >('overview');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const [revisionDesc, setRevisionDesc] = useState('');
  const [revisionDeadline, setRevisionDeadline] = useState('');
  const [revisionPriority, setRevisionPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');

  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<'initial' | 'revision'>('initial');

  useEffect(() => {
    if (id) loadProjectData(id);
  }, [id]);

  const loadProjectData = async (projId: string) => {
    try {
      setLoading(true);

      // 1. Fetch project with resilient fallback
      let proj: Project | null = null;
      try {
        proj = await getProjectById(projId);
      } catch (pErr) {
        console.warn('getProjectById caught error:', pErr);
      }

      if (!proj) {
        try {
          const { data: directData } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projId)
            .maybeSingle();
          if (directData) {
            proj = directData as Project;
          }
        } catch (dirErr) {
          console.warn('Direct project fetch failed:', dirErr);
        }
      }

      if (proj) {
        setProject(proj);
      }

      // 2. Fetch auxiliary lists safely via allSettled so no secondary failure blocks rendering
      const settled = await Promise.allSettled([
        getTasks({ projectId: projId }),
        getRevisions(projId),
        getDeliveries(projId),
        getActivityEvents({ project_id: projId }),
        getWorkstreams(projId),
        getEmployees(),
        getExtraWorkRecords({ projectId: projId }),
        getExtendedAvailability({ projectId: projId }),
      ]);

      const [
        tasksRes,
        revisionsRes,
        deliveriesRes,
        activitiesRes,
        workstreamsRes,
        employeesRes,
        extraWorkRes,
        extendedRes,
      ] = settled;

      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value || []);
      if (revisionsRes.status === 'fulfilled') setRevisions(revisionsRes.value || []);
      if (deliveriesRes.status === 'fulfilled') setDeliveries(deliveriesRes.value || []);
      if (activitiesRes.status === 'fulfilled') setActivities(activitiesRes.value || []);
      if (workstreamsRes.status === 'fulfilled') setWorkstreams(workstreamsRes.value || []);
      if (employeesRes.status === 'fulfilled') setEmployees(employeesRes.value || []);
      if (extraWorkRes.status === 'fulfilled') setExtraWorkRecords(extraWorkRes.value || []);
      if (extendedRes.status === 'fulfilled') setExtendedRecords(extendedRes.value || []);
    } catch (err) {
      console.error('loadProjectData error:', err);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newTaskTitle) return;

    try {
      await createTask(
        {
          title: newTaskTitle,
          description: newTaskDesc,
          project_id: project.id,
          priority: newTaskPriority,
          status: 'not_started',
          due_date: newTaskDueDate || undefined,
        },
        newTaskAssignee ? [newTaskAssignee] : []
      );

      toast.success('Task Added', `Task "${newTaskTitle}" created`);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setIsTaskModalOpen(false);
      loadProjectData(project.id);
    } catch (err: any) {
      toast.error('Failed to create task', err.message);
    }
  };

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !revisionDesc) return;

    try {
      await createRevision({
        project_id: project.id,
        change_description: revisionDesc,
        priority: revisionPriority,
        deadline: revisionDeadline || undefined,
      });

      toast.success('Revision Opened', 'New revision round opened and project status updated to Reopened');
      setRevisionDesc('');
      setIsRevisionModalOpen(false);
      loadProjectData(project.id);
    } catch (err: any) {
      toast.error('Failed to open revision', err.message);
    }
  };

  const handleRecordDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    try {
      await recordDelivery({
        project_id: project.id,
        delivery_type: deliveryType,
        delivery_notes: deliveryNotes,
      });

      toast.success('Delivery Recorded', 'Project marked as Delivered');
      setDeliveryNotes('');
      setIsDeliveryModalOpen(false);
      loadProjectData(project.id);
    } catch (err: any) {
      toast.error('Failed to record delivery', err.message);
    }
  };

  const handleArchive = async () => {
    if (!project) return;
    try {
      await archiveProject(project.id);
      toast.success('Project Archived', `Project "${project.name}" moved to Archive`);
      setIsArchiveConfirmOpen(false);
      navigate('/projects');
    } catch (err: any) {
      toast.error('Failed to archive', err.message);
    }
  };

  const handleReopen = async () => {
    if (!project) return;
    try {
      await reopenProject(project.id);
      toast.success('Project Reopened', `Project "${project.name}" marked as Reopened`);
      loadProjectData(project.id);
    } catch (err: any) {
      toast.error('Failed to reopen', err.message);
    }
  };

  if (!project && !loading) {
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto p-6 bg-surface rounded-2xl border-[0.5px] border-black shadow-soft">
          <p className="text-base font-semibold text-primary">Project Not Found</p>
          <p className="text-xs text-secondary mt-1">
            This project could not be found or may have been deleted.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => id && loadProjectData(id)}
              className="border-[0.5px] border-black text-xs"
            >
              Retry
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/projects')}
              className="border-[0.5px] border-black text-xs"
            >
              ← Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and Header */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary mb-3 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-primary">{project?.name}</h1>
              {project && <StatusBadge status={project.status} />}
              {project && <PriorityBadge priority={project.priority} />}
            </div>
            {project?.client_name && (
              <p className="text-xs text-accent font-medium mt-1">Client: {project.client_name}</p>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRevisionModalOpen(true)}
              icon={<History className="w-4 h-4 text-warning" />}
            >
              Open Revision
            </Button>

            <Button
              variant="success"
              size="sm"
              onClick={() => setIsDeliveryModalOpen(true)}
              icon={<PackageCheck className="w-4 h-4" />}
            >
              Record Delivery
            </Button>

            {project?.status === 'archived' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReopen}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Reopen
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsArchiveConfirmOpen(true)}
                icon={<Archive className="w-4 h-4" />}
              >
                Archive
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-6 text-xs font-semibold">
        {(['overview', 'tasks', 'extra_work', 'revisions', 'deliveries', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === tab
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <span>{tab === 'extra_work' ? 'Extra Work' : tab}</span>
            {tab === 'tasks' && ` (${tasks.length})`}
            {tab === 'extra_work' && ` (${extraWorkRecords.length + extendedRecords.length})`}
            {tab === 'revisions' && ` (${revisions.length})`}
            {tab === 'deliveries' && ` (${deliveries.length})`}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-primary mb-3">Project Description</h3>
              <p className="text-xs text-secondary leading-relaxed whitespace-pre-wrap">
                {project?.description || 'No detailed description provided for this project.'}
              </p>

              {project?.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-primary uppercase mb-1">Internal Notes</h4>
                  <p className="text-xs text-secondary leading-relaxed">{project.notes}</p>
                </div>
              )}
            </Card>

            {/* Quick Task Summary */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary">Key Deliverables</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsTaskModalOpen(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Task
                </Button>
              </div>

              <div className="divide-y divide-border text-xs">
                {tasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary">{t.title}</p>
                      <p className="text-[10px] text-secondary">
                        Due: {formatDate(t.due_date)} • Priority: {t.priority.toUpperCase()}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-xs text-secondary py-4 text-center">No tasks created yet.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Project Metadata */}
          <div className="space-y-4">
            <Card className="p-5 space-y-3.5 text-xs">
              <h3 className="text-sm font-semibold text-primary border-b border-border pb-2.5">
                Project Information
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-secondary">Type:</span>
                <span className="font-medium text-primary text-right max-w-[170px] truncate">
                  {project && PROJECT_TYPE_LABELS[project.project_type]}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-secondary">Start Date:</span>
                <span className="font-medium text-primary">{formatDate(project?.start_date)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-secondary">Target Delivery:</span>
                <span className="font-medium text-primary">{formatDate(project?.target_delivery_date)}</span>
              </div>

              {project?.actual_delivery_date && (
                <div className="flex items-center justify-between">
                  <span className="text-secondary">Actual Delivery:</span>
                  <span className="font-medium text-success">{formatDate(project.actual_delivery_date)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-secondary">Revision Rounds:</span>
                <span className="font-bold text-accent">{revisions.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-secondary">Extra Work Logged:</span>
                <span className="font-bold text-primary">
                  {formatMinutes(
                    extraWorkRecords.reduce((acc, w) => acc + (w.total_minutes || 0), 0) +
                      extendedRecords.reduce((acc, x) => acc + (x.active_work_minutes || 0), 0)
                  )}
                </span>
              </div>
            </Card>

            {/* Assigned Members */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-primary mb-3">Assigned Team Members</h3>
              <div className="space-y-2">
                {project?.members && project.members.length > 0 ? (
                  project.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2.5 text-xs py-1">
                      <div className="w-7 h-7 rounded-full bg-accent/15 text-accent font-bold flex items-center justify-center text-[10px]">
                        {m.employee?.initials || m.employee?.name?.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-primary">{m.employee?.name}</p>
                        <p className="text-[10px] text-secondary">{m.employee?.designation}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-secondary italic">No members assigned yet</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. TASKS TAB */}
      {activeTab === 'tasks' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-primary">All Project Tasks</h3>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsTaskModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Task
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                  <th className="py-2.5 px-3">Task Title</th>
                  <th className="py-2.5 px-3">Assignees</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/80">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-primary">{t.title}</p>
                      {t.description && (
                        <p className="text-[11px] text-secondary line-clamp-1">{t.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {t.assignees?.map((a) => (
                          <span
                            key={a.id}
                            className="px-2 py-0.5 rounded bg-gray-100 text-primary text-[10px] font-medium"
                          >
                            {a.employee?.name}
                          </span>
                        ))}
                        {(!t.assignees || t.assignees.length === 0) && (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 px-3 text-secondary">{formatDate(t.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length === 0 && (
              <p className="text-xs text-secondary text-center py-8">No tasks recorded yet</p>
            )}
          </div>
        </Card>
      )}

      {/* 3. EXTRA WORK & EXTENDED HOURS TAB */}
      {activeTab === 'extra_work' && (
        <div className="space-y-6">
          {/* Weekend Extra Work Table */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-primary">Weekend Extra Work Sessions</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Overtime and milestone delivery work logged on Saturdays and Sundays for this project
                </p>
              </div>
              <span className="text-xs font-bold text-accent">
                {extraWorkRecords.length} Sessions Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                    <th className="py-2.5 px-3">Day & Date</th>
                    <th className="py-2.5 px-3">Team Member</th>
                    <th className="py-2.5 px-3">Work Deliverable Description</th>
                    <th className="py-2.5 px-3">Timing</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Approval</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {extraWorkRecords.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-3 whitespace-nowrap">
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
                      <td className="py-3 px-3">
                        <span className="font-semibold text-primary">
                          {w.employee?.name || 'Unknown'}
                        </span>
                        <div className="text-[10px] text-secondary">
                          {w.employee?.designation}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-primary max-w-[220px]">
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
                      <td className="py-3 px-3 text-secondary">{w.admin_remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {extraWorkRecords.length === 0 && (
                <p className="text-xs text-secondary text-center py-8">
                  No weekend extra work sessions logged for this project
                </p>
              )}
            </div>
          </Card>

          {/* Extended Hours / Late Availability Table */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-primary">Late Availability & Extended Working Hours</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Overtime and standby sessions after regular office hours associated with this project
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700">
                {extendedRecords.length} Extended Sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Team Member</th>
                    <th className="py-2.5 px-3">Activity Type</th>
                    <th className="py-2.5 px-3">Hours Window</th>
                    <th className="py-2.5 px-3">Active Duration</th>
                    <th className="py-2.5 px-3">Standby</th>
                    <th className="py-2.5 px-3">Approval</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {extendedRecords.map((x) => (
                    <tr key={x.id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-3 font-medium text-primary whitespace-nowrap">
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
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
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
                      <td className="py-3 px-3">
                        <ApprovalBadge status={x.approval_status} />
                      </td>
                      <td className="py-3 px-3 text-secondary">
                        {x.reason || x.admin_remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {extendedRecords.length === 0 && (
                <p className="text-xs text-secondary text-center py-8">
                  No extended hours records logged for this project
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 4. REVISIONS TAB */}
      {activeTab === 'revisions' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-primary">Revision Rounds</h3>
              <p className="text-xs text-secondary mt-0.5">
                Every subsequent client change request is tracked under this original project
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRevisionModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Open Revision Round
            </Button>
          </div>

          <div className="space-y-3">
            {revisions.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl border border-border bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-accent text-sm">
                      Revision #{rev.revision_number}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200 uppercase text-[10px]">
                      {rev.status}
                    </span>
                    <PriorityBadge priority={rev.priority} />
                  </div>
                  <p className="text-primary font-medium">{rev.change_description}</p>
                  <p className="text-[11px] text-secondary mt-1">
                    Received: {formatDate(rev.date_received)} • Deadline: {formatDate(rev.deadline)}
                  </p>
                </div>
              </div>
            ))}

            {revisions.length === 0 && (
              <p className="text-xs text-secondary text-center py-8">
                No revisions opened. The project is on its initial version.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* 4. DELIVERIES TAB */}
      {activeTab === 'deliveries' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-primary">Delivery History</h3>
            <Button
              size="sm"
              variant="success"
              onClick={() => setIsDeliveryModalOpen(true)}
              icon={<PackageCheck className="w-3.5 h-3.5" />}
            >
              Record Delivery
            </Button>
          </div>

          <div className="divide-y divide-border text-xs">
            {deliveries.map((del) => (
              <div key={del.id} className="py-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-success capitalize">{del.delivery_type} Delivery</span>
                    <span className="text-secondary text-[11px]">
                      {formatDateTime(del.delivered_at)}
                    </span>
                  </div>
                  <p className="text-secondary mt-1">{del.delivery_notes || 'No delivery notes'}</p>
                </div>
              </div>
            ))}
            {deliveries.length === 0 && (
              <p className="text-xs text-secondary text-center py-8">No deliveries recorded yet</p>
            )}
          </div>
        </Card>
      )}

      {/* 5. ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-primary mb-4">Project Chronological Audit Log</h3>
          <div className="space-y-3">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                <div>
                  <p className="text-primary font-medium">{act.description}</p>
                  <p className="text-[10px] text-secondary">{formatDateTime(act.created_at)}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-xs text-secondary text-center py-8">No recorded activity</p>
            )}
          </div>
        </Card>
      )}

      {/* MODALS */}

      {/* Add Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Project Task"
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Task Title *
            </label>
            <input
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Design onboarding screen wireframes"
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Assignee
            </label>
            <select
              value={newTaskAssignee}
              onChange={(e) => setNewTaskAssignee(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">-- Choose Employee --</option>
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
                Priority
              </label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
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
                Due Date
              </label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Detailed instructions..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Revision Modal */}
      <Modal
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        title="Open Revision Round"
        subtitle="Record client change requests without duplicating the project"
        size="md"
      >
        <form onSubmit={handleCreateRevision} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Change Description *
            </label>
            <textarea
              required
              rows={4}
              value={revisionDesc}
              onChange={(e) => setRevisionDesc(e.target.value)}
              placeholder="Specify the client feedback, design changes or modified requirements..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Priority
              </label>
              <select
                value={revisionPriority}
                onChange={(e) => setRevisionPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={revisionDeadline}
                onChange={(e) => setRevisionDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsRevisionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Open Revision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delivery Modal */}
      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        title="Record Project Delivery"
        subtitle="Mark project as delivered and retain historical delivery record"
        size="md"
      >
        <form onSubmit={handleRecordDelivery} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Delivery Type
            </label>
            <select
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="initial">Initial Deliverable</option>
              <option value="revision">Revision Deliverable</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Delivery Notes / Deliverable Links
            </label>
            <textarea
              rows={3}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Figma handoff link, prototype URLs, exported assets..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsDeliveryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" type="submit">
              Confirm Delivery
            </Button>
          </div>
        </form>
      </Modal>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        title="Archive Project"
        message={`Are you sure you want to archive "${project?.name}"? It will be moved to the Archive where it remains searchable and reopenable.`}
        confirmLabel="Archive Project"
        onConfirm={handleArchive}
        onCancel={() => setIsArchiveConfirmOpen(false)}
      />
    </div>
  );
};

