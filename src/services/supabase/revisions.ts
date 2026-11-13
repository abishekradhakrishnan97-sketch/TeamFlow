import { supabase } from './client';
import {
  Revision,
  DeliveryRecord,
  UUID,
  DeliveryType,
} from '@/types';
import { logActivity } from './activity';
import { updateProject } from './projects';

export async function getRevisions(projectId?: UUID): Promise<Revision[]> {
  let query = supabase
    .from('revisions')
    .select(`
      *,
      project:projects(*),
      assignees:revision_assignees(
        id,
        employee:employees(*)
      )
    `)
    .order('revision_number', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getRevisionById(id: UUID): Promise<Revision | null> {
  const { data, error } = await supabase
    .from('revisions')
    .select(`
      *,
      project:projects(*),
      assignees:revision_assignees(
        id,
        employee:employees(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createRevision(
  revision: {
    project_id: UUID;
    change_description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    deadline?: string;
    date_received?: string;
  },
  assigneeIds: UUID[] = []
): Promise<Revision> {
  const { data: existingRevisions } = await supabase
    .from('revisions')
    .select('revision_number')
    .eq('project_id', revision.project_id)
    .order('revision_number', { ascending: false })
    .limit(1);

  const nextNumber =
    existingRevisions && existingRevisions.length > 0
      ? existingRevisions[0].revision_number + 1
      : 1;

  const { data: newRev, error } = await supabase
    .from('revisions')
    .insert([
      {
        ...revision,
        revision_number: nextNumber,
        date_received: revision.date_received || new Date().toISOString().split('T')[0],
        status: 'open',
      },
    ])
    .select()
    .single();

  if (error) throw error;

  if (assigneeIds.length > 0) {
    const rows = assigneeIds.map((empId) => ({
      revision_id: newRev.id,
      employee_id: empId,
    }));
    await supabase.from('revision_assignees').insert(rows);
  }

  await updateProject(revision.project_id, { status: 'reopened' });

  await logActivity({
    event_type: 'revision_created',
    description: `Opened Revision #${nextNumber} for project`,
    project_id: revision.project_id,
    revision_id: newRev.id,
    new_value: newRev,
  });

  return getRevisionById(newRev.id) as Promise<Revision>;
}

export async function updateRevision(
  id: UUID,
  updates: Partial<Revision>,
  assigneeIds?: UUID[]
): Promise<Revision> {
  const { data, error } = await supabase
    .from('revisions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (assigneeIds !== undefined) {
    await supabase.from('revision_assignees').delete().eq('revision_id', id);
    if (assigneeIds.length > 0) {
      const rows = assigneeIds.map((empId) => ({
        revision_id: id,
        employee_id: empId,
      }));
      await supabase.from('revision_assignees').insert(rows);
    }
  }

  if (updates.status === 'completed') {
    await logActivity({
      event_type: 'revision_completed',
      description: `Completed Revision #${data.revision_number}`,
      project_id: data.project_id,
      revision_id: id,
    });
  }

  return getRevisionById(id) as Promise<Revision>;
}

export async function getDeliveries(projectId?: UUID): Promise<DeliveryRecord[]> {
  let query = supabase
    .from('delivery_records')
    .select('*, project:projects(*), delivered_by:employees(*)')
    .order('delivered_at', { ascending: false });

  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function recordDelivery(params: {
  project_id: UUID;
  delivery_type: DeliveryType;
  revision_id?: UUID;
  delivery_notes?: string;
  delivered_by_id?: UUID;
}): Promise<DeliveryRecord> {
  const { data, error } = await supabase
    .from('delivery_records')
    .insert([params])
    .select('*, project:projects(*), delivered_by:employees(*)')
    .single();

  if (error) throw error;

  await updateProject(params.project_id, {
    status: 'delivered',
    actual_delivery_date: new Date().toISOString().split('T')[0],
  });

  if (params.revision_id) {
    await updateRevision(params.revision_id, {
      status: 'completed',
      completion_date: new Date().toISOString().split('T')[0],
      delivery_notes: params.delivery_notes,
    });
  }

  await logActivity({
    event_type: 'delivery_created',
    description: `Delivered project (${params.delivery_type})`,
    project_id: params.project_id,
    revision_id: params.revision_id,
    new_value: data,
  });

  return data;
}
