import { supabase } from './client';
import { Task, UUID, TaskStatus, ActivityEventType } from '@/types';
import { logActivity } from './activity';

export async function getTasks(options?: {
  projectId?: UUID;
  employeeId?: UUID;
  status?: TaskStatus;
  search?: string;
}): Promise<Task[]> {
  try {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*),
        workstream:workstreams(*),
        workflow_stage:workflow_stages(*),
        assignees:task_assignees(
          id,
          employee_id,
          employee:employees(*)
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (options?.projectId) {
      query = query.eq('project_id', options.projectId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.search) {
      query = query.ilike('title', `%${options.search}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      let tasks = data as Task[];
      if (options?.employeeId) {
        tasks = tasks.filter((t) =>
          t.assignees?.some(
            (a: any) =>
              a.employee?.id === options.employeeId ||
              a.employee_id === options.employeeId
          )
        );
      }
      return tasks;
    }
    if (error) {
      console.warn('getTasks rich query failed, using fallback:', error.message);
    }
  } catch (err) {
    console.warn('getTasks rich query threw exception:', err);
  }

  // Fallback query without complex joins
  try {
    let fallbackQuery = supabase
      .from('tasks')
      .select('*, project:projects(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (options?.projectId) fallbackQuery = fallbackQuery.eq('project_id', options.projectId);
    if (options?.status) fallbackQuery = fallbackQuery.eq('status', options.status);

    const { data: baseTasks } = await fallbackQuery;
    if (!baseTasks) return [];

    const taskIds = baseTasks.map((t) => t.id);
    let assigneeMap = new Map<string, any[]>();
    if (taskIds.length > 0) {
      try {
        const { data: assignees } = await supabase
          .from('task_assignees')
          .select('id, task_id, employee_id, employee:employees(*)')
          .in('task_id', taskIds);

        (assignees || []).forEach((a: any) => {
          const list = assigneeMap.get(a.task_id) || [];
          list.push(a);
          assigneeMap.set(a.task_id, list);
        });
      } catch {
        // Safe to ignore
      }
    }

    let result = baseTasks.map((t) => ({
      ...t,
      assignees: assigneeMap.get(t.id) || [],
    })) as Task[];

    if (options?.employeeId) {
      result = result.filter((t) =>
        t.assignees?.some(
          (a: any) =>
            a.employee?.id === options.employeeId ||
            a.employee_id === options.employeeId
        )
      );
    }

    return result;
  } catch (fbErr) {
    console.error('getTasks fallback completely failed:', fbErr);
    return [];
  }
}

export async function getTaskById(id: UUID): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*),
        workstream:workstreams(*),
        workflow_stage:workflow_stages(*),
        assignees:task_assignees(
          id,
          employee_id,
          employee:employees(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (!error && data) return data as Task;
    if (error) console.warn('getTaskById rich query failed:', error.message);
  } catch (err) {
    console.warn('getTaskById rich query threw:', err);
  }

  // Fallback query
  try {
    const { data: baseTask, error: baseErr } = await supabase
      .from('tasks')
      .select('*, project:projects(*)')
      .eq('id', id)
      .maybeSingle();

    if (baseErr || !baseTask) return null;

    let assignees: any[] = [];
    try {
      const { data: assigneeRows } = await supabase
        .from('task_assignees')
        .select('id, task_id, employee_id, employee:employees(*)')
        .eq('task_id', id);
      assignees = assigneeRows || [];
    } catch {
      // Safe to ignore
    }

    return {
      ...baseTask,
      assignees,
    } as Task;
  } catch (fbErr) {
    console.error('getTaskById fallback failed:', fbErr);
    return null;
  }
}

export async function createTask(
  task: Partial<Task>,
  assigneeIds: UUID[] = []
): Promise<Task> {
  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();

  if (error) throw error;

  if (assigneeIds.length > 0) {
    const assigneeRows = assigneeIds.map((empId) => ({
      task_id: newTask.id,
      employee_id: empId,
    }));
    await supabase.from('task_assignees').insert(assigneeRows);
  }

  await logActivity({
    event_type: 'task_created',
    description: `Created task "${newTask.title}"`,
    task_id: newTask.id,
    project_id: newTask.project_id,
    new_value: newTask,
  });

  return getTaskById(newTask.id) as Promise<Task>;
}

export async function updateTask(
  id: UUID,
  updates: Partial<Task>,
  assigneeIds?: UUID[]
): Promise<Task> {
  const previous = await getTaskById(id);

  const { data: updated, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (assigneeIds !== undefined) {
    await supabase.from('task_assignees').delete().eq('task_id', id);
    if (assigneeIds.length > 0) {
      const rows = assigneeIds.map((empId) => ({
        task_id: id,
        employee_id: empId,
      }));
      await supabase.from('task_assignees').insert(rows);
    }
  }

  if (updates.status && updates.status !== previous?.status) {
    let eventType: ActivityEventType = 'task_status_changed';
    if (updates.status === 'completed') {
      eventType = 'task_completed';
    } else if (previous?.status === 'completed') {
      eventType = 'task_reopened';
    }

    await logActivity({
      event_type: eventType,
      description: `Task "${updated.title}" status changed to ${updates.status}`,
      task_id: id,
      project_id: updated.project_id,
      previous_value: { status: previous?.status },
      new_value: { status: updates.status },
    });
  } else {
    await logActivity({
      event_type: 'task_updated',
      description: `Updated task "${updated.title}"`,
      task_id: id,
      project_id: updated.project_id,
      previous_value: previous as unknown as Record<string, unknown>,
      new_value: updated,
    });
  }

  return getTaskById(id) as Promise<Task>;
}

export async function updateTaskStatus(
  id: UUID,
  status: TaskStatus,
  workflowStageId?: UUID
): Promise<Task> {
  const updates: Partial<Task> = { status };
  if (workflowStageId) updates.workflow_stage_id = workflowStageId;
  if (status === 'completed') updates.completion_date = new Date().toISOString().split('T')[0];
  return updateTask(id, updates);
}

export async function deleteTask(id: UUID, soft = true): Promise<void> {
  const task = await getTaskById(id);
  if (soft) {
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  }

  await logActivity({
    event_type: 'task_deleted',
    description: `Deleted task "${task?.title || id}"`,
    task_id: id,
    project_id: task?.project_id,
  });
}

export async function duplicateTask(id: UUID): Promise<Task> {
  const task = await getTaskById(id);
  if (!task) throw new Error('Task not found');

  const assigneeIds = task.assignees?.map((a) => a.employee?.id).filter(Boolean) as UUID[] || [];

  return createTask(
    {
      title: `${task.title} (Copy)`,
      description: task.description,
      project_id: task.project_id,
      workstream_id: task.workstream_id,
      workflow_stage_id: task.workflow_stage_id,
      priority: task.priority,
      status: 'not_started',
      start_date: task.start_date,
      due_date: task.due_date,
      notes: task.notes,
    },
    assigneeIds
  );
}
