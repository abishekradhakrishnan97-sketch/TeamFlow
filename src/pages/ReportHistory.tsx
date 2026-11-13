import React, { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { getReportDocuments, deleteReportDocument } from '@/services/supabase/reports';
import { getSignedUrl } from '@/services/supabase/storage';
import { ReportDocument } from '@/types';
import { formatDate, formatDateTime } from '@/utils/dates';
import { formatFileSize } from '@/utils/calculations';
import { useToast } from '@/store/useAppStore';
import {
  FileCheck2,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  Search,
} from 'lucide-react';

export const ReportHistory: React.FC = () => {
  const toast = useToast();
  const [documents, setDocuments] = useState<ReportDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const docs = await getReportDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: ReportDocument) => {
    if (!doc.storage_path) {
      toast.error('File path missing');
      return;
    }

    try {
      const signedUrl = await getSignedUrl(
        (doc.storage_bucket as any) || 'teamflow-reports',
        doc.storage_path,
        3600
      );

      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        toast.error('Failed to obtain download URL from Supabase Storage');
      }
    } catch (err: any) {
      toast.error('Download error', err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteDocId) return;
    try {
      await deleteReportDocument(deleteDocId);
      toast.success('Report Deleted', 'Removed from database and storage');
      setDeleteDocId(null);
      loadReports();
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = d.report_name.toLowerCase().includes(q);
      const matchEmp = d.employee?.name?.toLowerCase().includes(q);
      if (!matchName && !matchEmp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Report Documents History</h2>
          <p className="text-xs text-secondary mt-0.5">
            Archived PDF statements stored permanently in private Supabase Storage
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search report name or employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                <th className="py-2.5 px-3">Report Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Target Scope</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Generated Date</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Storage Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/80">
                  <td className="py-3 px-3">
                    <p className="font-semibold text-primary">{doc.report_name}</p>
                    <p className="text-[10px] text-secondary font-mono truncate max-w-[200px]">
                      {doc.storage_path}
                    </p>
                  </td>

                  <td className="py-3 px-3 capitalize font-medium">
                    {doc.report_type.replace(/_/g, ' ')}
                  </td>

                  <td className="py-3 px-3 font-medium text-primary">
                    {doc.employee?.name || (doc.scope === 'team' ? 'Entire Team' : 'Project')}
                  </td>

                  <td className="py-3 px-3 text-secondary">
                    {formatDate(doc.period_start)} → {formatDate(doc.period_end)}
                  </td>

                  <td className="py-3 px-3 text-secondary">{formatDateTime(doc.created_at)}</td>

                  <td className="py-3 px-3 text-secondary">
                    {doc.file_size_bytes ? formatFileSize(doc.file_size_bytes) : '—'}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        doc.upload_status === 'uploaded'
                          ? 'bg-emerald-50 text-success border-emerald-200'
                          : 'bg-rose-50 text-danger border-rose-200'
                      }`}
                    >
                      {doc.upload_status}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        icon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        View / Download
                      </Button>

                      <button
                        onClick={() => setDeleteDocId(doc.id)}
                        title="Delete Document"
                        className="p-1.5 rounded text-gray-400 hover:text-danger hover:bg-gray-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDocs.length === 0 && !loading && (
            <EmptyState
              icon={<FileCheck2 className="w-8 h-8" />}
              title="No reports generated yet"
              description="Generated statements will be permanently archived and available for download here."
            />
          )}
        </div>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteDocId)}
        title="Delete Report Document"
        message="Are you sure you want to permanently delete this report from Supabase Storage and remove its history record?"
        confirmLabel="Delete Report"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDocId(null)}
      />
    </div>
  );
};
