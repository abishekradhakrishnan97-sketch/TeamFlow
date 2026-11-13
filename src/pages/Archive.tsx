import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { getProjects, reopenProject } from '@/services/supabase/projects';
import { Project, PROJECT_TYPE_LABELS } from '@/types';
import { formatDate } from '@/utils/dates';
import { useToast } from '@/store/useAppStore';
import { Archive as ArchiveIcon, RotateCcw, Search, Eye } from 'lucide-react';

export const Archive: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadArchived();
  }, []);

  const loadArchived = async () => {
    try {
      setLoading(true);
      const data = await getProjects({ status: 'archived', includeArchived: true });
      setArchivedProjects(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load archived projects');
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await reopenProject(project.id);
      toast.success('Project Reopened', `"${project.name}" has been restored to active status`);
      loadArchived();
    } catch (err: any) {
      toast.error('Failed to reopen project', err.message);
    }
  };

  const filtered = archivedProjects.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchClient = p.client_name?.toLowerCase().includes(q);
      if (!matchName && !matchClient) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Archived Projects</h2>
          <p className="text-xs text-secondary mt-0.5">
            Preserved historical deliverables, revisions, tasks and activity logs
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search archived projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </Card>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-secondary uppercase bg-gray-50/50">
                <th className="py-2.5 px-3">Project Name</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Delivered Date</th>
                <th className="py-2.5 px-3">Archive Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((proj) => (
                <tr
                  key={proj.id}
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  className="hover:bg-gray-50/80 cursor-pointer"
                >
                  <td className="py-3 px-3 font-semibold text-primary">{proj.name}</td>
                  <td className="py-3 px-3 text-secondary">{proj.client_name || '—'}</td>
                  <td className="py-3 px-3 text-secondary">
                    {PROJECT_TYPE_LABELS[proj.project_type] || proj.project_type}
                  </td>
                  <td className="py-3 px-3 text-secondary">
                    {formatDate(proj.actual_delivery_date || proj.target_delivery_date)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase border border-gray-200">
                      Archived
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div
                      className="inline-flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/projects/${proj.id}`)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => handleReopen(proj, e)}
                        icon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Reopen Project
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && !loading && (
            <EmptyState
              icon={<ArchiveIcon className="w-8 h-8" />}
              title="Archive is clean"
              description="When projects are finished and archived from their details page, they will appear here."
            />
          )}
        </div>
      </Card>
    </div>
  );
};

