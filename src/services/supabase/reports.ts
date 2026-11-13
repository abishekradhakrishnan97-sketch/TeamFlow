import { supabase } from './client';
import { ReportDocument, UUID, ReportType, ReportScope } from '@/types';
import { uploadFile, getSignedUrl, deleteFile } from './storage';

export async function getReportDocuments(options?: {
  reportType?: ReportType;
  employeeId?: UUID;
  projectId?: UUID;
}): Promise<ReportDocument[]> {
  let query = supabase
    .from('report_documents')
    .select('*, employee:employees(*)')
    .order('created_at', { ascending: false });

  if (options?.reportType) query = query.eq('report_type', options.reportType);
  if (options?.employeeId) query = query.eq('employee_id', options.employeeId);
  if (options?.projectId) query = query.eq('project_id', options.projectId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function saveReportDocument(params: {
  report_name: string;
  report_type: ReportType;
  scope: ReportScope;
  period: any;
  period_start: string;
  period_end: string;
  employee_id?: UUID;
  project_id?: UUID;
  pdfBlob: Blob;
  generated_by?: string;
}): Promise<{ document: ReportDocument; signedUrl: string | null }> {
  const year = new Date(params.period_start).getFullYear() || 2026;
  const monthName = new Date(params.period_start).toLocaleString('default', { month: 'long' });
  const sanitizedName = params.report_name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const storagePath = `${year}/${monthName}/${sanitizedName}_${Date.now()}.pdf`;

  // 1. Upload to Supabase Storage bucket 'teamflow-reports'
  const uploadResult = await uploadFile(
    'teamflow-reports',
    storagePath,
    params.pdfBlob,
    'application/pdf'
  );

  const upload_status = uploadResult.error ? 'failed' : 'uploaded';

  // 2. Insert metadata record in report_documents
  const { data, error } = await supabase
    .from('report_documents')
    .insert([
      {
        report_name: params.report_name,
        report_type: params.report_type,
        scope: params.scope,
        period: params.period,
        period_start: params.period_start,
        period_end: params.period_end,
        employee_id: params.employee_id,
        project_id: params.project_id,
        storage_path: uploadResult.path || storagePath,
        storage_bucket: 'teamflow-reports',
        file_size_bytes: params.pdfBlob.size,
        generated_by: params.generated_by || 'Design Lead',
        upload_status,
      },
    ])
    .select('*, employee:employees(*)')
    .single();

  if (error) throw error;

  // 3. Generate signed URL for immediate download/preview
  let signedUrl: string | null = null;
  if (upload_status === 'uploaded') {
    signedUrl = await getSignedUrl('teamflow-reports', storagePath);
  }

  return { document: data, signedUrl };
}

export async function deleteReportDocument(id: UUID): Promise<void> {
  // First fetch the document to find storage path
  const { data: doc, error: fetchError } = await supabase
    .from('report_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  if (doc?.storage_path) {
    await deleteFile('teamflow-reports', doc.storage_path);
  }

  const { error } = await supabase.from('report_documents').delete().eq('id', id);
  if (error) throw error;
}

