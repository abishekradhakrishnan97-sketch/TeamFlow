import React, { useState, useEffect } from 'react';
import { Card, MetricCard } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { PriorityBadge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  getRevisions,
  createRevision,
  updateRevision,
  getDeliveries,
  recordDelivery,
} from '@/services/supabase/revisions';
import { getProjects } from '@/services/supabase/projects';
import { getEmployees } from '@/services/supabase/employees';
import { Revision, Project, Employee, Priority, RevisionStatus } from '@/types';
import { formatDate } from '@/utils/dates';
import { useToast } from '@/store/useAppStore';
import {
  History,
  Plus,
  CheckCircle2,
  Clock,
  RotateCcw,
  PackageCheck,
  Search,
} from 'lucide-react';

export const Revisions: React.FC = () => {
  const toast = useToast();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New Revision Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formProjectId, setFormProjectId] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('high');
  const [formDeadline, setFormDeadline] = useState('');
  const [formAssignees, setFormAssignees] = useState<string[]>([]);

  // Complete Revision Modal
  const [completingRevision, setCompletingRevision] = useState<Revision | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [r, p, e] = await Promise.all([
        getRevisions(),
        getProjects({ includeArchived: false }),
        getEmployees(),
      ]);
      setRevisions(r);
      setProjects(p);
      setEmployees(e);
      if (p.length > 0 && !formProjectId) setFormProjectId(p[0].id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load revision rounds');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjectId || !formDesc) {
      toast.error('Validation Error', 'Project and change description are required');
      return;
    }

    try {
      await createRevision(
        {
          project_id: formProjectId,
          change_description: formDesc,
          priority: formPriority,
          deadline: formDeadline || undefined,
        },
        formAssignees
      );

      toast.success('Revision Opened', 'New revision round created. Project marked as Reopened.');
      setIsModalOpen(false);
      setFormDesc('');
      loadData();
    } catch (err: any) {
      toast.error('Failed to open revision', err.message);
    }
  };

  const handleCompleteRevision = async () => {
    if (!completingRevision) return;
    try {
      // Record a revision delivery and mark revision completed
      await recordDelivery({
        project_id: completingRevision.project_id,
        delivery_type: 'revision',
        revision_id: completingRevision.id,
        delivery_notes: deliveryNotes,
      });

      toast.success('Revision Delivered', `Revision #${completingRevision.revision_number} delivered`);
      setCompletingRevision(null);
      setDeliveryNotes('');
      loadData();
    } catch (err: any) {
      toast.error('Completion failed', err.message);
    }
  };

  const openRevisions = revisions.filter((r) => r.status === 'open' || r.status === 'in_progress');
  const completedRevisions = revisions.filter((r) => r.status === 'completed');

  const filteredRevisions = revisions.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchDesc = r.change_description.toLowerCase().includes(q);
      const matchProj = r.project?.name?.toLowerCase().includes(q);
      if (!matchDesc && !matchProj) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Revision & Delivery Rounds</h2>
          <p className="text-xs text-secondary mt-0.5">
            Handle client change rounds without duplicating projects. Unlimited iterations supported.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Open New Revision
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Open Revisions"
          value={openRevisions.length}
          icon={<RotateCcw className="w-5 h-5" />}
          color="warning"
          subtitle="Active Iterations"
        />
        <MetricCard
          label="Completed Rounds"
          value={completedRevisions.length}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
          subtitle="Delivered Changes"
        />
        <MetricCard
          label="Total Rounds"
          value={revisions.length}
          icon={<History className="w-5 h-5" />}
          color="accent"
          subtitle="Across All Projects"
        />
        <MetricCard
          label="Reopened Projects"
          value={projects.filter((p) => p.status === 'reopened').length}
          icon={<RotateCcw className="w-5 h-5" />}
          color="primary"
          subtitle="Currently Active"
        />
      </div>

      {/* Filter */}
      <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search revision description or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </Card>

      {/* Revisions List */}
      <div className="space-y-3">
        {filteredRevisions.map((rev) => (
          <Card key={rev.id} className="p-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-accent text-sm">
                    Revision #{rev.revision_number}
                  </span>
                  <span className="font-semibold text-primary text-sm">
                    {rev.project?.name || 'Unknown Project'}
                  </span>
                  {rev.project?.client_name && (
                    <span className="text-xs text-secondary font-medium">
                      ({rev.project.client_name})
                    </span>
                  )}
                  <PriorityBadge priority={rev.priority} />
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      rev.status === 'completed'
                        ? 'bg-emerald-50 text-success border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>

                <p className="text-xs text-primary font-medium leading-relaxed mt-1">
                  {rev.change_description}
                </p>

                <div className="flex items-center gap-4 text-xs text-secondary pt-1 flex-wrap">
                  <span>Received: {formatDate(rev.date_received)}</span>
                  <span>Deadline: {formatDate(rev.deadline)}</span>
                  {rev.completion_date && (
                    <span className="text-success font-semibold">
                      Completed: {formatDate(rev.completion_date)}
                    </span>
                  )}
                </div>

                {rev.delivery_notes && (
                  <p className="text-[11px] text-secondary bg-gray-50 p-2 rounded border border-gray-100 mt-2">
                    <span className="font-semibold">Delivery notes:</span> {rev.delivery_notes}
                  </p>
                )}
              </div>

              {rev.status !== 'completed' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    setCompletingRevision(rev);
                    setDeliveryNotes('');
                  }}
                  icon={<PackageCheck className="w-3.5 h-3.5" />}
                >
                  Deliver Revision
                </Button>
              )}
            </div>
          </Card>
        ))}

        {filteredRevisions.length === 0 && !loading && (
          <EmptyState
            icon={<History className="w-8 h-8" />}
            title="No revisions recorded"
            description="When clients request changes to delivered projects, open a revision round to preserve full history."
            actionLabel="Open New Revision"
            onAction={() => setIsModalOpen(true)}
          />
        )}
      </div>

      {/* OPEN REVISION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Open New Revision Round"
        subtitle="Attach client changes to the original project. Never duplicate project entities."
        size="lg"
      >
        <form onSubmit={handleCreateRevision} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Target Project *
            </label>
            <select
              required
              value={formProjectId}
              onChange={(e) => setFormProjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.client_name ? `(${p.client_name})` : ''} — Status: {p.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Client Change Description *
            </label>
            <textarea
              required
              rows={4}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Detail specific feedback, changed specifications, or requested asset revisions..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Revision Priority
              </label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Open Revision Round
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELIVER REVISION MODAL */}
      <Modal
        isOpen={Boolean(completingRevision)}
        onClose={() => setCompletingRevision(null)}
        title={`Deliver Revision #${completingRevision?.revision_number}`}
        subtitle={`Project: ${completingRevision?.project?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Delivery Notes / Links
            </label>
            <textarea
              rows={3}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Exported new assets to Drive, updated Figma pages 4-8..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCompletingRevision(null)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleCompleteRevision}
            >
              Confirm Delivery
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

