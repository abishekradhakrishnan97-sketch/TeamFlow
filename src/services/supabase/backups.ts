import { supabase } from './client';
import { BackupRecord } from '@/types';
import { uploadFile } from './storage';

export async function getBackupRecords(): Promise<BackupRecord[]> {
  const { data, error } = await supabase
    .from('backup_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function exportAllData(): Promise<Record<string, unknown[]>> {
  const tables = [
    'departments',
    'employees',
    'workflow_templates',
    'workflow_stages',
    'projects',
    'project_members',
    'workstreams',
    'tasks',
    'task_assignees',
    'attendance_records',
    'attendance_permissions',
    'early_logoffs',
    'extended_availability',
    'extra_work_records',
    'leave_records',
    'revisions',
    'revision_assignees',
    'delivery_records',
    'activity_events',
    'holidays',
    'app_settings',
    'report_documents',
  ];

  const backupData: Record<string, unknown[]> = {};

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (!error && data) {
      backupData[table] = data;
    } else {
      backupData[table] = [];
    }
  }

  return backupData;
}

export async function createBackup(description?: string): Promise<BackupRecord> {
  const data = await exportAllData();

  const record_counts: Record<string, number> = {};
  for (const [table, rows] of Object.entries(data)) {
    record_counts[table] = rows.length;
  }

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  const now = new Date();
  const year = now.getFullYear();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const filename = `TeamFlow_Backup_${now.toISOString().replace(/[:.]/g, '-')}.json`;
  const storagePath = `${year}/${monthName}/${filename}`;

  const uploadRes = await uploadFile(
    'teamflow-backups',
    storagePath,
    blob,
    'application/json'
  );

  const { data: record, error } = await supabase
    .from('backup_records')
    .insert([
      {
        description: description || `Backup created on ${now.toLocaleDateString()}`,
        storage_path: uploadRes.path || storagePath,
        storage_bucket: 'teamflow-backups',
        file_size_bytes: blob.size,
        record_counts,
        created_by: 'Design Lead',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return record;
}

export async function restoreFromBackupData(
  jsonData: Record<string, any[]>
): Promise<{ success: boolean; restored: Record<string, number> }> {
  const restoredCounts: Record<string, number> = {};

  const tableOrder = [
    'departments',
    'employees',
    'workflow_templates',
    'workflow_stages',
    'projects',
    'project_members',
    'workstreams',
    'tasks',
    'task_assignees',
    'attendance_records',
    'attendance_permissions',
    'early_logoffs',
    'extended_availability',
    'extra_work_records',
    'leave_records',
    'revisions',
    'revision_assignees',
    'delivery_records',
    'activity_events',
    'holidays',
    'app_settings',
  ];

  for (const table of tableOrder) {
    const rows = jsonData[table];
    if (rows && Array.isArray(rows) && rows.length > 0) {
      const { error } = await supabase.from(table).upsert(rows);
      if (!error) {
        restoredCounts[table] = rows.length;
      } else {
        console.warn(`Restore warning for ${table}:`, error.message);
      }
    }
  }

  return { success: true, restored: restoredCounts };
}
