import React, { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { StatusBadge, PriorityBadge } from '@/components/shared/Badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  duplicateTask,
} from '@/services/supabase/tasks';
import { getProjects } from '@/services/supabase/projects';
import { getEmployees } from '@/services/supabase/employees';
import {
  Task,
  Project,
  Employee,
  TaskStatus,
  Priority,
  TASK_STATUS_LABELS,
} from '@/types';
import { formatDate } from '@/utils/dates';
import { useToast } from '@/store/useAppStore';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Copy,
  Trash2,
  Calendar,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';

const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'not_started', label: 'Not Started', color: 'border-t-gray-400' },
  { id: 'working', label: 'In Progress', color: 'border-t-accent' },
  { id: 'on_hold', label: 'On Hold', color: 'border-t-amber-400' },
  { id: 'blocked', label: 'Blocked', color: 'border-t-rose-500' },
  { id: 'ready_for_review', label: 'Review', color: 'border-t-indigo-400' },
  { id: 'completed', label: 'Completed', color: 'border-t-emerald-500' },
];

export const Tasks: React.FC = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: Kanban or List
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Drag and drop state
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Task Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<{
    title: string;
    description: string;
    project_id: string;
    priority: Priority;
    status: TaskStatus;
    start_date: string;
    due_date: string;
    assigneeIds: string[];
  }>({
    title: '',
    description: '',
    project_id: '',
    priority: 'medium',
    status: 'not_started',
    start_date: '',
    due_date: '',
    assigneeIds: [],
  });

  // Delete Confirm
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [t, p, e] = await Promise.all([
        getTasks(),
        getProjects({ includeArchived: false }),
        getEmployees(),
      ]);
      setTasks(t);
      setProjects(p);
      setEmployees(e);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      project_id: projects[0]?.id || '',
      priority: 'medium',
      status: 'not_started',
      start_date: '',
      due_date: '',
      assigneeIds: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      project_id: task.project_id,
      priority: task.priority,
      status: task.status,
      start_date: task.start_date || '',
      due_date: task.due_date || '',
      assigneeIds: task.assignees?.map((a) => a.employee?.id).filter(Boolean) as string[] || [],
    });
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.project_id) {
      toast.error('Validation Error', 'Title and project are required');
      return;
    }

    try {
      if (editingTask) {
        await updateTask(
          editingTask.id,
          {
            title: taskForm.title,
            description: taskForm.description,
            project_id: taskForm.project_id,
            priority: taskForm.priority,
            status: taskForm.status,
            start_date: taskForm.start_date || undefined,
            due_date: taskForm.due_date || undefined,
          },
          taskForm.assigneeIds
        );
        toast.success('Task Updated', `Task "${taskForm.title}" saved`);
      } else {
        await createTask(
          {
            title: taskForm.title,
            description: taskForm.description,
            project_id: taskForm.project_id,
            priority: taskForm.priority,
            status: taskForm.status,
            start_date: taskForm.start_date || undefined,
            due_date: taskForm.due_date || undefined,
          },
          taskForm.assigneeIds
        );
        toast.success('Task Created', `Task "${taskForm.title}" created`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Error saving task', err.message);
    }
  };

  const handleDuplicate = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await duplicateTask(taskId);
      toast.success('Task Duplicated');
      loadData();
    } catch (err: any) {
      toast.error('Duplicate failed', err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTaskId) return;
    try {
      await deleteTask(deleteTaskId);
      toast.success('Task Deleted');
      setDeleteTaskId(null);
      loadData();
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    let targetStatus: TaskStatus | null = null;

    // Check if dropped directly on a column
    if (KANBAN_COLUMNS.some((col) => col.id === over.id)) {
      targetStatus = over.id as TaskStatus;
    } else {
      // Dropped on another task
      const targetTask = tasks.find((t) => t.id === over.id);
      if (targetTask) targetStatus = targetTask.status;
    }

    if (targetStatus) {
      // Optimistic update in UI
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus! } : t))
      );

      try {
        await updateTaskStatus(taskId, targetStatus);
      } catch (err) {
        console.error('Failed to update task status:', err);
        toast.error('Status Update Failed');
        loadData();
      }
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterProject !== 'all' && t.project_id !== filterProject) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (
      filterEmployee !== 'all' &&
      !t.assignees?.some((a) => a.employee?.id === filterEmployee)
    ) {
      return false;
    }
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Task Tracker & Kanban</h2>
          <p className="text-xs text-secondary mt-0.5">
            Monitor, reassign, prioritize and track all multidisciplinary tasks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-primary shadow-xs' : 'text-secondary hover:text-primary'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-white text-primary shadow-xs' : 'text-secondary hover:text-primary'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <Button
            variant="primary"
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4" />}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search task title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Project filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent max-w-[160px]"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Employee filter */}
          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent max-w-[150px]"
          >
            <option value="all">All Assignees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </Card>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);

              return (
                <div
                  key={col.id}
                  id={col.id}
                  className={`bg-white rounded-xl border border-border p-3 flex flex-col min-h-[500px] border-t-4 ${col.color}`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
                    <span className="text-xs font-bold text-primary">{col.label}</span>
                    <span className="text-[11px] font-semibold text-secondary px-2 py-0.5 rounded-full bg-gray-100">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards */}
                  <SortableContext
                    id={col.id}
                    items={colTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-thin">
                      {colTasks.map((task) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          onClick={() => openEditModal(task)}
                          onDuplicate={(e) => handleDuplicate(task.id, e)}
                          onDelete={(e) => {
                            e.stopPropagation();
                            setDeleteTaskId(task.id);
                          }}
                        />
                      ))}

                      {colTasks.length === 0 && (
                        <div className="h-28 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-[11px] text-gray-400">
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="bg-white p-3.5 rounded-xl border border-accent shadow-xl rotate-1 opacity-90 w-64 text-xs">
                <PriorityBadge priority={activeTask.priority} />
                <h4 className="font-semibold text-primary mt-2">{activeTask.title}</h4>
                <p className="text-[10px] text-secondary mt-1">{activeTask.project?.name}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Assignees</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => openEditModal(task)}
                  className="hover:bg-gray-50/80 cursor-pointer"
                >
                  <td className="py-3 px-3 font-semibold text-primary">{task.title}</td>
                  <td className="py-3 px-3 text-secondary font-medium">
                    {task.project?.name || '—'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      {task.assignees?.map((a) => (
                        <span
                          key={a.id}
                          className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-primary"
                        >
                          {a.employee?.name}
                        </span>
                      ))}
                      {(!task.assignees || task.assignees.length === 0) && (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="py-3 px-3 text-secondary">{formatDate(task.due_date)}</td>
                  <td className="py-3 px-3 text-right">
                    <div
                      className="inline-flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleDuplicate(task.id, e)}
                        title="Duplicate Task"
                        className="p-1 rounded text-gray-400 hover:text-accent hover:bg-gray-100"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTaskId(task.id)}
                        title="Delete Task"
                        className="p-1 rounded text-gray-400 hover:text-danger hover:bg-gray-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTasks.length === 0 && (
            <p className="text-xs text-secondary text-center py-8">No tasks found</p>
          )}
        </Card>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Task Title *
            </label>
            <input
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="e.g. Design responsive dashboard tables & states"
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Project *
              </label>
              <select
                required
                value={taskForm.project_id}
                onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Status
              </label>
              <select
                value={taskForm.status}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {Object.entries(TASK_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Priority
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, priority: e.target.value as Priority })
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
                Start Date
              </label>
              <input
                type="date"
                value={taskForm.start_date}
                onChange={(e) => setTaskForm({ ...taskForm, start_date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Multi-member Assignees */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
              Assigned Members ({taskForm.assigneeIds.length} selected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 border border-border rounded-lg bg-gray-50/50">
              {employees.map((emp) => {
                const isSelected = taskForm.assigneeIds.includes(emp.id);
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
                          setTaskForm({
                            ...taskForm,
                            assigneeIds: [...taskForm.assigneeIds, emp.id],
                          });
                        } else {
                          setTaskForm({
                            ...taskForm,
                            assigneeIds: taskForm.assigneeIds.filter((id) => id !== emp.id),
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

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Detailed guidelines, constraints, acceptance criteria..."
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
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTaskId)}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action can be undone from audit logs if needed."
        confirmLabel="Delete Task"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
};

// Sortable Kanban Task Card
const SortableTaskCard: React.FC<{
  task: Task;
  onClick: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ task, onClick, onDuplicate, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="p-3 bg-white rounded-lg border border-border shadow-xs hover:border-gray-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-xs space-y-2 group"
    >
      <div className="flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={onDuplicate}
            title="Duplicate"
            className="p-0.5 text-gray-400 hover:text-accent"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-0.5 text-gray-400 hover:text-danger"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <h4 className="font-semibold text-primary line-clamp-2 leading-snug">{task.title}</h4>

      <p className="text-[10px] text-accent font-medium truncate">
        {task.project?.name || '—'}
      </p>

      {/* Assignee badges & date */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] text-secondary">
        <div className="flex -space-x-1 overflow-hidden">
          {task.assignees?.map((a) => (
            <div
              key={a.id}
              title={a.employee?.name}
              className="w-5 h-5 rounded-full bg-accent/15 text-accent font-bold flex items-center justify-center text-[8px] ring-1 ring-white"
            >
              {a.employee?.initials || a.employee?.name?.slice(0, 2)}
            </div>
          ))}
          {(!task.assignees || task.assignees.length === 0) && (
            <span className="text-gray-400 italic">Unassigned</span>
          )}
        </div>

        {task.due_date && <span>Due: {formatDate(task.due_date)}</span>}
      </div>
    </div>
  );
};

