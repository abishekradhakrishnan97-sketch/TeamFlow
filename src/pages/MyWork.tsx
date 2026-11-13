import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, MetricCard } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { StatusBadge, PriorityBadge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { getDesignLeadEmployee } from '@/services/supabase/employees';
import { getTasks, updateTaskStatus } from '@/services/supabase/tasks';
import { getProjects } from '@/services/supabase/projects';
import { getActivityEvents } from '@/services/supabase/activity';
import { getEmployeeProjects } from '@/utils/employeeProjects';
import { formatDate, formatRelativeTime, todayIST } from '@/utils/dates';
import { useToast } from '@/store/useAppStore';
import { Employee, Project, Task, ActivityEvent, TaskStatus, Priority } from '@/types';
import {
  Briefcase,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Calendar,
  FileText,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  History,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';

export const MyWork: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useDashboardTheme();
  const toast = useToast();

  const [lead, setLead] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'tasks' | 'projects' | 'history'
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'history'>('tasks');

  // Task Filter Tab: 'all' | 'not_started' | 'working' | 'in_review' | 'completed' | 'overdue'
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');

  // Quick Progress Update Modal
  const [updatingTask, setUpdatingTask] = useState<Task | null>(null);
  const [newStatus, setNewStatus] = useState<TaskStatus>('working');
  const [progressRemarks, setProgressRemarks] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    loadMyWork();
  }, []);

  const loadMyWork = async () => {
    try {
      setLoading(true);
      const leadEmp = await getDesignLeadEmployee();
      setLead(leadEmp);

      const [allProjects, allTasks, actRes] = await Promise.all([
        getProjects({ includeArchived: false }),
        getTasks({ employeeId: leadEmp.id }),
        getActivityEvents({ employee_id: leadEmp.id, limit: 100 }),
      ]);

      // Projects where Abishek is assigned as member, owner, or has assigned tasks
      const leadProjects = getEmployeeProjects(leadEmp.id, allProjects, allTasks);

      setProjects(leadProjects);
      setTasks(allTasks);
      setActivities(actRes);
    } catch (err) {
      console.error('Failed to load My Work data:', err);
      toast.error('Could not load assigned work items');
    } finally {
      setLoading(false);
    }
  };

  const today = todayIST();

  // Metrics
  const activeProjectsCount = projects.filter(
    (p) => p.status === 'active' || p.status === 'under_review'
  ).length;
  const inProgressTasks = tasks.filter((t) => t.status === 'working');
  const inReviewTasks = tasks.filter((t) => t.status === 'ready_for_review');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.due_date && t.due_date < today
  );
  const upcomingTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.due_date && t.due_date >= today
  );

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (taskSearch) {
        const query = taskSearch.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesProj = t.project?.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesProj) return false;
      }

      // Project filter
      if (selectedProjectFilter !== 'all' && t.project_id !== selectedProjectFilter) {
        return false;
      }

      // Status filter
      if (taskStatusFilter === 'all') return true;
      if (taskStatusFilter === 'overdue') {
        return t.status !== 'completed' && t.due_date && t.due_date < today;
      }
      return t.status === taskStatusFilter;
    });
  }, [tasks, taskSearch, selectedProjectFilter, taskStatusFilter, today]);

  const handleOpenStatusModal = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdatingTask(task);
    setNewStatus(task.status);
    setProgressRemarks('');
  };

  const handleSaveTaskStatus = async () => {
    if (!updatingTask) return;
    try {
      setSavingProgress(true);
      await updateTaskStatus(updatingTask.id, newStatus);
      toast.success('Task Status Updated', `Updated "${updatingTask.title}" to ${newStatus}`);
      setUpdatingTask(null);
      loadMyWork();
    } catch (err: any) {
      toast.error('Failed to update task', err.message);
    } finally {
      setSavingProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6 border-[0.5px] border-black">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent text-white font-bold text-2xl flex items-center justify-center shadow-soft border-[0.5px] border-black shrink-0">
              {lead?.initials || 'AB'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-primary dark:text-[#F5F3EE]">
                  {lead?.name || 'Abishek'} — Design Lead Workbench
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFAED0]/25 text-[#631838] dark:text-[#EFAED0] border-[0.5px] border-black/20">
                  <Sparkles className="w-3 h-3" />
                  Lead Self-Assignment & Contributor Mode
                </span>
              </div>
              <p className="text-xs text-secondary dark:text-[#85838A] mt-1">
                Personal execution portfolio, assigned projects, active deliverables, and individual HR work log
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/tasks')}
              icon={<CheckSquare className="w-4 h-4" />}
              className="border-[0.5px] border-black text-xs font-bold"
            >
              Task Board
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                navigate('/reports');
              }}
              icon={<FileText className="w-4 h-4" />}
              className="border-[0.5px] border-black text-xs font-bold shadow-soft"
            >
              Generate My HR Statement
            </Button>
          </div>
        </div>
      </Card>

      {/* Metrics Row: Personal Executive Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard
          label="Assigned Projects"
          value={projects.length}
          icon={<FolderKanban className="w-4 h-4" />}
          color="accent"
        />
        <MetricCard
          label="Active Projects"
          value={activeProjectsCount}
          icon={<TrendingUp className="w-4 h-4" />}
          color="accent"
        />
        <MetricCard
          label="Total Tasks"
          value={tasks.length}
          icon={<CheckSquare className="w-4 h-4" />}
          color="accent"
        />
        <MetricCard
          label="In Progress"
          value={inProgressTasks.length}
          icon={<Clock className="w-4 h-4" />}
          color="warning"
        />
        <MetricCard
          label="In Review"
          value={inReviewTasks.length}
          icon={<Layers className="w-4 h-4" />}
          color="accent"
        />
        <MetricCard
          label="Completed"
          value={completedTasks.length}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="success"
        />
        <MetricCard
          label="Overdue"
          value={overdueTasks.length}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={overdueTasks.length > 0 ? 'danger' : 'accent'}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b-[0.5px] border-black/15 dark:border-[#393940] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('tasks')}
          className={clsx(
            'px-4 py-2 rounded-xl transition-all flex items-center gap-2 border-[0.5px]',
            activeTab === 'tasks'
              ? isDark
                ? 'bg-[#27272B] text-[#F5F3EE] border-[#393940]'
                : 'bg-[#222222] text-[#FFFDF7] border-black shadow-xs'
              : isDark
              ? 'text-[#85838A] hover:text-[#F5F3EE] border-transparent'
              : 'text-secondary hover:text-primary border-transparent'
          )}
        >
          <CheckSquare className="w-4 h-4" />
          <span>My Assigned Tasks ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={clsx(
            'px-4 py-2 rounded-xl transition-all flex items-center gap-2 border-[0.5px]',
            activeTab === 'projects'
              ? isDark
                ? 'bg-[#27272B] text-[#F5F3EE] border-[#393940]'
                : 'bg-[#222222] text-[#FFFDF7] border-black shadow-xs'
              : isDark
              ? 'text-[#85838A] hover:text-[#F5F3EE] border-transparent'
              : 'text-secondary hover:text-primary border-transparent'
          )}
        >
          <FolderKanban className="w-4 h-4" />
          <span>My Projects ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={clsx(
            'px-4 py-2 rounded-xl transition-all flex items-center gap-2 border-[0.5px]',
            activeTab === 'history'
              ? isDark
                ? 'bg-[#27272B] text-[#F5F3EE] border-[#393940]'
                : 'bg-[#222222] text-[#FFFDF7] border-black shadow-xs'
              : isDark
              ? 'text-[#85838A] hover:text-[#F5F3EE] border-transparent'
              : 'text-secondary hover:text-primary border-transparent'
          )}
        >
          <History className="w-4 h-4" />
          <span>Work Contribution History ({activities.length})</span>
        </button>
      </div>

      {/* 1. MY TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-[0.5px] border-black">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search my tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 dark:bg-[#27272B] border border-border dark:border-[#393940] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Project filter */}
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#27272B] border border-border dark:border-[#393940] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent font-medium max-w-[180px] truncate"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Status Pills */}
              <div className="flex items-center gap-1 text-xs">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'working', label: 'In Progress' },
                  { id: 'ready_for_review', label: 'In Review' },
                  { id: 'not_started', label: 'Not Started' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'overdue', label: 'Overdue' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTaskStatusFilter(s.id)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors',
                      taskStatusFilter === s.id
                        ? isDark
                          ? 'bg-[#27272B] text-[#F5F3EE]'
                          : 'bg-[#222222] text-[#FFFDF7]'
                        : isDark
                        ? 'text-[#85838A] hover:text-[#F5F3EE]'
                        : 'text-secondary hover:text-primary'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Task Items Table / List */}
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="w-6 h-6 text-secondary" />}
              title="No tasks match the filter"
              description="You have no tasks assigned in this status or category."
            />
          ) : (
            <div className="space-y-2.5">
              {filteredTasks.map((task) => {
                const isOverdue =
                  task.status !== 'completed' && task.due_date && task.due_date < today;

                return (
                  <Card
                    key={task.id}
                    className="p-4 border-[0.5px] border-black hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />

                          {task.project && (
                            <span
                              onClick={() => navigate(`/projects/${task.project?.id}`)}
                              className="text-[11px] font-bold text-accent hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>{task.project.name}</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          )}

                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E99A88]/20 text-[#C93B2B] dark:text-[#E99A88] border-[0.5px] border-[#E99A88]/40">
                              Overdue
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-primary dark:text-[#F5F3EE] tracking-tight">
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="text-xs text-secondary dark:text-[#85838A] mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-secondary dark:text-[#85838A] flex-wrap">
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Due {formatDate(task.due_date)}</span>
                            </span>
                          )}

                          {task.assignees && task.assignees.length > 1 && (
                            <span className="text-[11px] font-medium">
                              Collaborating with:{' '}
                              {task.assignees
                                .filter((a) => a.employee?.id !== lead?.id)
                                .map((a) => a.employee?.name)
                                .join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenStatusModal(task, e)}
                          className="border-[0.5px] border-black text-xs font-bold"
                        >
                          Update Status
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. MY PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const isOwner = proj.owner_id === lead?.id;
            const projectTasks = tasks.filter((t) => t.project_id === proj.id);
            const myCompletedCount = projectTasks.filter((t) => t.status === 'completed').length;
            const progress =
              projectTasks.length > 0
                ? Math.round((myCompletedCount / projectTasks.length) * 100)
                : 0;

            return (
              <Card
                key={proj.id}
                onClick={() => navigate(`/projects/${proj.id}`)}
                className="p-5 border-[0.5px] border-black flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <StatusBadge status={proj.status} />
                    {isOwner ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A9BB78]/25 text-[#2D4018] dark:text-[#A9BB78] border-[0.5px] border-black/20">
                        Project Lead
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#AFC7E9]/25 text-[#24456E] dark:text-[#AFC7E9] border-[0.5px] border-black/20">
                        Assigned Contributor
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-primary dark:text-[#F5F3EE] group-hover:text-accent transition-colors">
                    {proj.name}
                  </h3>

                  {proj.client_name && (
                    <p className="text-xs text-secondary dark:text-[#85838A] mt-0.5">
                      Client: {proj.client_name}
                    </p>
                  )}

                  {proj.description && (
                    <p className="text-xs text-secondary dark:text-[#85838A] mt-2 line-clamp-2">
                      {proj.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t-[0.5px] border-black/10 dark:border-[#393940]">
                  <div className="flex items-center justify-between text-xs text-secondary dark:text-[#85838A] mb-1.5">
                    <span>My Tasks: {myCompletedCount} / {projectTasks.length}</span>
                    <span className="font-bold text-primary dark:text-[#F5F3EE]">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-[#27272B] overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-secondary dark:text-[#85838A] mt-3">
                    <span>
                      Delivery: {proj.target_delivery_date ? formatDate(proj.target_delivery_date) : 'TBD'}
                    </span>
                    <span className="font-bold text-accent flex items-center gap-1 group-hover:underline">
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}

          {projects.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<FolderKanban className="w-6 h-6 text-secondary" />}
                title="No projects assigned"
                description="Assign yourself to projects from the Projects directory."
              />
            </div>
          )}
        </div>
      )}

      {/* 3. WORK CONTRIBUTION HISTORY TAB */}
      {activeTab === 'history' && (
        <Card className="p-5 border-[0.5px] border-black">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-primary dark:text-[#F5F3EE]">
                Chronological Contribution Audit Trail
              </h3>
              <p className="text-xs text-secondary dark:text-[#85838A]">
                Historical record of task executions, delivery checkpoints, and work items recorded under Abishek
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/reports')}
              icon={<FileText className="w-3.5 h-3.5" />}
              className="text-xs font-bold border-[0.5px] border-black"
            >
              Export Work Statement
            </Button>
          </div>

          <div className="divide-y divide-border text-xs">
            {activities.map((act) => (
              <div key={act.id} className="py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#AFC7E9]/25 text-[#24456E] dark:text-[#AFC7E9] flex items-center justify-center shrink-0 mt-0.5 border-[0.5px] border-black/15">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary dark:text-[#F5F3EE]">
                    {act.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-secondary dark:text-[#85838A]">
                    <span className="font-medium uppercase tracking-wider">{act.event_type.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(act.created_at)}</span>
                    <span>•</span>
                    <span>{formatDate(act.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <p className="text-xs text-secondary text-center py-8">
                No activity records logged for this employee profile yet. Newly logged actions will appear here automatically.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* QUICK STATUS UPDATE MODAL */}
      <Modal
        isOpen={Boolean(updatingTask)}
        onClose={() => setUpdatingTask(null)}
        title="Update Task Execution Status"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-secondary font-medium">Task Title</p>
            <p className="text-sm font-bold text-primary dark:text-[#F5F3EE] mt-0.5">
              {updatingTask?.title}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary dark:text-[#F5F3EE] uppercase mb-1.5">
              Execution Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#27272B] border border-border dark:border-[#393940] rounded-lg font-medium"
            >
              <option value="not_started">Not Started</option>
              <option value="working">In Progress / Working</option>
              <option value="ready_for_review">Ready for Review</option>
              <option value="completed">Completed & Delivered</option>
              <option value="blocked">Blocked</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpdatingTask(null)}
              className="text-xs font-bold border-[0.5px] border-black"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={savingProgress}
              onClick={handleSaveTaskStatus}
              className="text-xs font-bold border-[0.5px] border-black"
            >
              Save Update
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
