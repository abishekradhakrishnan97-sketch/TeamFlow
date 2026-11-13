import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useForm } from 'react-hook-form';
import { Project, Employee, ProjectType } from '@/types';
import { getProjects, createProject } from '@/services/supabase/projects';
import { createTask } from '@/services/supabase/tasks';
import { getEmployees } from '@/services/supabase/employees';
import { useToast } from '@/store/useAppStore';
import { Zap } from 'lucide-react';

interface QuickRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface QuickRequestFormData {
  title: string;
  type: ProjectType;
  description: string;
  linkMode: 'standalone' | 'existing';
  projectId?: string;
  clientName?: string;
  assignedEmployeeId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
}

const QUICK_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'document_pdf_formatting', label: 'PDF / Document Formatting' },
  { value: 'presentation_slide_design', label: 'Presentation / Slide Redesign' },
  { value: 'graphic_design', label: 'Graphic Design Asset' },
  { value: 'existing_project_maintenance', label: 'Small UI Modification / Change' },
  { value: 'other', label: 'Sudden / Custom Request' },
];

export const QuickRequestModal: React.FC<QuickRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const toast = useToast();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<QuickRequestFormData>({
    defaultValues: {
      type: 'document_pdf_formatting',
      linkMode: 'standalone',
      priority: 'high',
    },
  });

  const linkMode = watch('linkMode');

  useEffect(() => {
    if (isOpen) {
      getProjects({ includeArchived: false }).then(setProjects).catch(console.error);
      getEmployees().then(setEmployees).catch(console.error);
    }
  }, [isOpen]);

  const onSubmit = async (data: QuickRequestFormData) => {
    try {
      setLoading(true);

      if (data.linkMode === 'standalone') {
        // Create as a quick-request project
        const newProj = await createProject(
          {
            name: data.title,
            client_name: data.clientName || 'Quick Request',
            description: data.description,
            project_type: data.type,
            priority: data.priority,
            status: 'active',
            start_date: new Date().toISOString().split('T')[0],
            target_delivery_date: data.dueDate,
            is_quick_request: true,
          },
          data.assignedEmployeeId ? [data.assignedEmployeeId] : []
        );

        // Also create a primary task under it
        await createTask(
          {
            title: data.title,
            description: data.description,
            project_id: newProj.id,
            priority: data.priority,
            status: 'working',
            due_date: data.dueDate,
          },
          data.assignedEmployeeId ? [data.assignedEmployeeId] : []
        );

        toast.success('Quick Request Created', `Created standalone project "${data.title}"`);
      } else {
        // Link to existing project as a prioritized task
        if (!data.projectId) {
          toast.error('Validation Error', 'Please select a project to link this request to');
          return;
        }

        await createTask(
          {
            title: `[Quick Request] ${data.title}`,
            description: data.description,
            project_id: data.projectId,
            priority: data.priority,
            status: 'working',
            due_date: data.dueDate,
          },
          data.assignedEmployeeId ? [data.assignedEmployeeId] : []
        );

        toast.success('Quick Request Added', `Task added to existing project`);
      }

      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error('Creation Failed', err.message || 'Unable to create quick request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Quick Request"
      subtitle="Rapidly dispatch emergency tasks, slide redesigns, PDF edits and graphic requests"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Request Title */}
        <div>
          <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
            Request Title *
          </label>
          <input
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g. Executive Pitch Deck Reformatting (Slide 1-12)"
            className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {errors.title && (
            <p className="text-xs text-danger mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Request Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
              Request Type
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {QUICK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
              Priority
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="urgent">🔴 Urgent / Same Day</option>
              <option value="high">🟠 High</option>
              <option value="medium">🔵 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
          </div>
        </div>

        {/* Link Mode: Standalone or Link to Existing */}
        <div>
          <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
            Destination
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-xs font-medium ${
                linkMode === 'standalone'
                  ? 'border-accent bg-indigo-50/50 text-accent'
                  : 'border-border text-secondary hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                value="standalone"
                {...register('linkMode')}
                className="text-accent focus:ring-accent"
              />
              <span>Standalone Project</span>
            </label>

            <label
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-xs font-medium ${
                linkMode === 'existing'
                  ? 'border-accent bg-indigo-50/50 text-accent'
                  : 'border-border text-secondary hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                value="existing"
                {...register('linkMode')}
                className="text-accent focus:ring-accent"
              />
              <span>Link to Existing Project</span>
            </label>
          </div>
        </div>

        {linkMode === 'existing' ? (
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
              Select Target Project *
            </label>
            <select
              {...register('projectId')}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">-- Choose Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.client_name ? `(${p.client_name})` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
              Client / Requester (Optional)
            </label>
            <input
              {...register('clientName')}
              placeholder="e.g. CEO Office / Marketing Team"
              className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}

        {/* Assigned Team Member & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
              Assign To
            </label>
            <select
              {...register('assignedEmployeeId')}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">-- Unassigned (Assign Later) --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.designation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
              Due Date / Deadline
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Description / Instructions */}
        <div>
          <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
            Instructions / Notes
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Provide specific guidelines, source file references, or requirements..."
            className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="secondary" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            loading={loading}
            icon={<Zap className="w-4 h-4 fill-white" />}
          >
            Dispatch Quick Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

