import { supabase } from './client';
import {
  Project,
  Workstream,
  WorkflowTemplate,
  WorkflowStage,
  UUID,
  ProjectStatus,
} from '@/types';
import { logActivity } from './activity';

export async function getProjects(options?: {
  status?: ProjectStatus;
  includeArchived?: boolean;
  search?: string;
}): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select(`
      *,
      owner:employees(*),
      members:project_members(
        id, role,
        employee:employees(*)
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  } else if (!options?.includeArchived) {
    query = query.neq('status', 'archived');
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,client_name.ilike.%${options.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getProjectById(id: UUID): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      owner:employees(*),
      members:project_members(
        id, role,
        employee:employees(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProject(
  project: Partial<Project>,
  memberIds: UUID[] = []
): Promise<Project> {
  const { data: newProject, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();

  if (error) throw error;

  // Add members if any
  if (memberIds.length > 0) {
    const memberRows = memberIds.map((empId) => ({
      project_id: newProject.id,
      employee_id: empId,
    }));
    const { error: memberError } = await supabase
      .from('project_members')
      .insert(memberRows);
    if (memberError) console.error('Failed to add project members:', memberError);
  }

  await logActivity({
    event_type: 'project_created',
    description: `Created project "${newProject.name}"${newProject.client_name ? ` for ${newProject.client_name}` : ''}`,
    project_id: newProject.id,
    new_value: newProject,
  });

  return getProjectById(newProject.id) as Promise<Project>;
}

export async function updateProject(
  id: UUID,
  updates: Partial<Project>,
  memberIds?: UUID[]
): Promise<Project> {
  const previous = await getProjectById(id);

  const { data: updated, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (memberIds !== undefined) {
    // Delete existing members and replace
    await supabase.from('project_members').delete().eq('project_id', id);
    if (memberIds.length > 0) {
      const rows = memberIds.map((empId) => ({
        project_id: id,
        employee_id: empId,
      }));
      await supabase.from('project_members').insert(rows);
    }
  }

  // Detect status change for dedicated audit logging
  if (updates.status && updates.status !== previous?.status) {
    let eventType = 'project_status_changed';
    if (updates.status === 'delivered') eventType = 'project_delivered';
    else if (updates.status === 'archived') eventType = 'project_archived';
    else if (updates.status === 'reopened') eventType = 'project_reopened';

    await logActivity({
      event_type: eventType as any,
      description: `Project "${updated.name}" status changed from ${previous?.status} to ${updates.status}`,
      project_id: id,
      previous_value: { status: previous?.status },
      new_value: { status: updates.status },
    });
  } else {
    await logActivity({
      event_type: 'project_updated',
      description: `Updated project "${updated.name}"`,
      project_id: id,
      previous_value: previous as unknown as Record<string, unknown>,
      new_value: updated,
    });
  }

  return getProjectById(id) as Promise<Project>;
}

export async function archiveProject(id: UUID): Promise<void> {
  await updateProject(id, { status: 'archived' });
}

export async function reopenProject(id: UUID): Promise<void> {
  await updateProject(id, { status: 'reopened' });
}

export async function deleteProject(id: UUID, soft = true): Promise<void> {
  if (soft) {
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}

// Workstreams
export async function getWorkstreams(projectId: UUID): Promise<Workstream[]> {
  const { data, error } = await supabase
    .from('workstreams')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index');
  if (error) throw error;
  return data || [];
}

export async function createWorkstream(
  projectId: UUID,
  name: string,
  description?: string
): Promise<Workstream> {
  const { data, error } = await supabase
    .from('workstreams')
    .insert([{ project_id: projectId, name, description }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkstream(id: UUID): Promise<void> {
  const { error } = await supabase.from('workstreams').delete().eq('id', id);
  if (error) throw error;
}

// Workflow templates & stages
export async function getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const { data, error } = await supabase
    .from('workflow_templates')
    .select('*, stages:workflow_stages(*)')
    .order('created_at');
  if (error) throw error;

  return (data || []).map((t) => ({
    ...t,
    stages: (t.stages || []).sort((a: WorkflowStage, b: WorkflowStage) => a.order_index - b.order_index),
  }));
}

export async function createWorkflowTemplate(
  name: string,
  description?: string,
  stages: { name: string; color?: string; order_index: number }[] = []
): Promise<WorkflowTemplate> {
  const { data: template, error } = await supabase
    .from('workflow_templates')
    .insert([{ name, description }])
    .select()
    .single();
  if (error) throw error;

  if (stages.length > 0) {
    const stageRows = stages.map((s, idx) => ({
      template_id: template.id,
      name: s.name,
      color: s.color || '#6258E8',
      order_index: s.order_index || idx + 1,
    }));
    await supabase.from('workflow_stages').insert(stageRows);
  }

  const { data: fullTemplate } = await supabase
    .from('workflow_templates')
    .select('*, stages:workflow_stages(*)')
    .eq('id', template.id)
    .single();

  return fullTemplate;
}
