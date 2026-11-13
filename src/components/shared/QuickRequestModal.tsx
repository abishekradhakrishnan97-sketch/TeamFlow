import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useForm } from 'react-hook-form';
import { Project, Employee, ProjectType } from '@/types';
import { getProjects, createProject } from '@/services/supabase/projects';
import { createTask } from '@/services/supabase/tasks';
import { getEmployees } from '@/services/supabase/employees';
import { useToast } from '@/store/useAppStore';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';
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
  const { isDark } = useDashboardTheme();
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
        if (!data.projectId) {
          toast.error('Selection Missing', 'Please select an existing project to link');
          setLoading(false);
          return;
        }

        await createTask(
          {
            title: data.title,
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

  const inputClass = clsx(
    'w-full px-3.5 py-2 text-sm rounded-xl border-[0.5px] transition-colors focus:outline-none focus:ring-2',
    isDark
      ? 'bg-[#27272B] border-[#393940] text-[#F5F3EE] placeholder-[#85838A] focus:ring-[#AFC7E9]'
      : 'bg-white border-border text-primary focus:ring-accent'
  );

  const labelClass = clsx(
    'block text-xs font-semibold uppercase mb-1.5',
    isDark ? 'text-[#B5B2AD]' : 'text-primary'
  );

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
          <label className={labelClass}>
            Request Title *
          </label>
          <input
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g. Executive Pitch Deck Reformatting (Slide 1-12)"
            className={inputClass}
          />
          {errors.title && (
            <p className="text-xs text-danger mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Request Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Request Type
            </label>
            <select
              {...register('type')}
              className={inputClass}
            >
              {QUICK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Priority
            </label>
            <select
              {...register('priority')}
              className={inputClass}
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
          <label className={labelClass}>
            Destination
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={clsx(
                'flex items-center gap-2 p-3 rounded-xl border-[0.5px] cursor-pointer text-xs font-medium transition-colors',
                linkMode === 'standalone'
                  ? (isDark
                      ? 'border-[#AFC7E9] bg-[#AFC7E9]/15 text-[#AFC7E9]'
                      : 'border-accent bg-indigo-50/50 text-accent')
                  : (isDark
                      ? 'border-[#393940] text-[#B5B2AD] hover:bg-[#27272B]'
                      : 'border-border text-secondary hover:bg-gray-50')
              )}
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
              className={clsx(
                'flex items-center gap-2 p-3 rounded-xl border-[0.5px] cursor-pointer text-xs font-medium transition-colors',
                linkMode === 'existing'
                  ? (isDark
                      ? 'border-[#AFC7E9] bg-[#AFC7E9]/15 text-[#AFC7E9]'
                      : 'border-accent bg-indigo-50/50 text-accent')
                  : (isDark
                      ? 'border-[#393940] text-[#B5B2AD] hover:bg-[#27272B]'
                      : 'border-border text-secondary hover:bg-gray-50')
              )}
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
            <label className={labelClass}>
              Select Target Project *
            </label>
            <select
              {...register('projectId')}
              className={inputClass}
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
            <label className={labelClass}>
              Client / Requester (Optional)
            </label>
            <input
              {...register('clientName')}
              placeholder="e.g. CEO Office / Marketing Team"
              className={inputClass}
            />
          </div>
        )}

        {/* Assigned Team Member & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Assign To
            </label>
            <select
              {...register('assignedEmployeeId')}
              className={inputClass}
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
            <label className={labelClass}>
              Due Date / Deadline
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className={inputClass}
            />
          </div>
        </div>

        {/* Description / Instructions */}
        <div>
          <label className={labelClass}>
            Instructions / Notes
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Provide specific guidelines, source file references, or requirements..."
            className={clsx(inputClass, 'resize-none')}
          />
        </div>

        {/* Actions */}
        <div
          className={clsx(
            'flex items-center justify-end gap-3 pt-4 border-t-[0.5px]',
            isDark ? 'border-t-[#393940]' : 'border-t-border'
          )}
        >
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={onClose}
            className={clsx(
              'border-[0.5px]',
              isDark ? 'bg-[#27272B] hover:bg-[#303036] text-[#F5F3EE] border-[#393940]' : ''
            )}
          >
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
