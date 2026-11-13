import React, { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  getBackupRecords,
  createBackup,
  restoreFromBackupData,
  exportAllData,
} from '@/services/supabase/backups';
import { downloadFile } from '@/services/supabase/storage';
import { BackupRecord } from '@/types';
import { formatDateTime } from '@/utils/dates';
import { formatFileSize } from '@/utils/calculations';
import { useToast } from '@/store/useAppStore';
import {
  Database,
  CloudUpload,
  Download,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  Upload,
} from 'lucide-react';

export const BackupRestore: React.FC = () => {
  const toast = useToast();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Restore state
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupRecord | null>(null);
  const [importedJson, setImportedJson] = useState<Record<string, any[]> | null>(null);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await getBackupRecords();
      setBackups(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load backup records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsBackingUp(true);
      const newBackup = await createBackup(
        `Manual snapshot created by Design Lead on ${new Date().toLocaleString('en-GB')}`
      );
      toast.success(
        'Backup Created & Uploaded',
        `Complete database snapshot uploaded to teamflow-backups`
      );
      loadBackups();
    } catch (err: any) {
      toast.error('Backup Failed', err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadBackup = async (b: BackupRecord) => {
    try {
      const blob = await downloadFile('teamflow-backups', b.storage_path);
      if (!blob) throw new Error('Could not download file from storage');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = b.storage_path.split('/').pop() || 'TeamFlow_Backup.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Download Failed', err.message);
    }
  };

  const handleFileSelectForRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed !== 'object' || !parsed.employees) {
          toast.error('Invalid Backup File', 'File is missing required TeamFlow database tables');
          return;
        }
        setImportedJson(parsed);
        setIsConfirmRestoreOpen(true);
      } catch (err: any) {
        toast.error('Invalid JSON', 'Could not parse the selected file');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!importedJson && !selectedBackupForRestore) return;

    try {
      setIsRestoring(true);

      // Create safety snapshot first!
      toast.info('Safety Snapshot', 'Creating automatic pre-restore backup first...');
      await createBackup('Automatic pre-restore safety snapshot');

      let targetData = importedJson;

      if (!targetData && selectedBackupForRestore) {
        const blob = await downloadFile('teamflow-backups', selectedBackupForRestore.storage_path);
        if (!blob) throw new Error('Unable to download backup from cloud');
        const text = await blob.text();
        targetData = JSON.parse(text);
      }

      if (targetData) {
        const result = await restoreFromBackupData(targetData);
        toast.success(
          'Restore Complete',
          `Restored ${Object.values(result.restored).reduce((a, b) => a + b, 0)} total records`
        );
      }

      setIsConfirmRestoreOpen(false);
      setImportedJson(null);
      setSelectedBackupForRestore(null);
      loadBackups();
    } catch (err: any) {
      toast.error('Restore Failed', err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Cloud Backup & Recovery</h2>
          <p className="text-xs text-secondary mt-0.5">
            Full JSON snapshots of all 19 database tables with recovery in private Supabase Storage
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Restore from local JSON button */}
          <label className="inline-flex items-center justify-center font-medium rounded-lg text-xs px-3 py-2 bg-white text-primary border border-border hover:bg-gray-50 cursor-pointer shadow-sm">
            <Upload className="w-3.5 h-3.5 mr-1.5 text-secondary" />
            <span>Upload JSON to Restore</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelectForRestore}
              className="hidden"
            />
          </label>

          <Button
            variant="primary"
            onClick={handleCreateBackup}
            loading={isBackingUp}
            icon={<CloudUpload className="w-4 h-4" />}
          >
            Create Snapshot Now
          </Button>
        </div>
      </div>

      {/* Safety Notice */}
      <Card className="p-4 bg-indigo-50/50 border-indigo-200 text-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-primary">Atomic Safety Restoration Guarantee</h4>
            <p className="text-secondary leading-relaxed">
              Before restoring any previous backup, TeamFlow automatically creates a safety snapshot
              of current data. No data is ever silently overwritten without historical preservation.
            </p>
          </div>
        </div>
      </Card>

      {/* Backup History Table */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-primary mb-4">Cloud Backup Archive</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                <th className="py-2.5 px-3">Backup Description</th>
                <th className="py-2.5 px-3">Storage Path</th>
                <th className="py-2.5 px-3">Created Date</th>
                <th className="py-2.5 px-3">File Size</th>
                <th className="py-2.5 px-3">Record Counts</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/80">
                  <td className="py-3 px-3 font-semibold text-primary">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-accent shrink-0" />
                      <span>{b.description || 'System Snapshot'}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-secondary">
                    {b.storage_path}
                  </td>

                  <td className="py-3 px-3 text-secondary">{formatDateTime(b.created_at)}</td>

                  <td className="py-3 px-3 text-secondary">
                    {b.file_size_bytes ? formatFileSize(b.file_size_bytes) : '—'}
                  </td>

                  <td className="py-3 px-3">
                    <span className="text-[11px] font-medium text-accent">
                      {b.record_counts
                        ? Object.values(b.record_counts).reduce((a, b) => a + b, 0)
                        : 0}{' '}
                      records
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownloadBackup(b)}
                        icon={<Download className="w-3.5 h-3.5" />}
                      >
                        Download
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBackupForRestore(b);
                          setImportedJson(null);
                          setIsConfirmRestoreOpen(true);
                        }}
                        icon={<RotateCcw className="w-3.5 h-3.5 text-warning" />}
                      >
                        Restore
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {backups.length === 0 && !loading && (
            <EmptyState
              icon={<Database className="w-8 h-8" />}
              title="No backups created yet"
              description="Create a manual cloud snapshot before major changes or set up periodic backups."
              actionLabel="Create Backup Now"
              onAction={handleCreateBackup}
            />
          )}
        </div>
      </Card>

      {/* CONFIRM RESTORE DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmRestoreOpen}
        title="Confirm Application Data Restoration"
        message="Restoring from a backup will update database records with the contents of the snapshot. A pre-restore safety snapshot will automatically be generated first. Do you wish to proceed?"
        confirmLabel="Proceed with Restore"
        variant="primary"
        loading={isRestoring}
        onConfirm={handleExecuteRestore}
        onCancel={() => {
          setIsConfirmRestoreOpen(false);
          setImportedJson(null);
          setSelectedBackupForRestore(null);
        }}
      />
    </div>
  );
};

