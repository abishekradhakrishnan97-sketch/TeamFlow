import React, { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { getWorkflowTemplates, createWorkflowTemplate } from '@/services/supabase/projects';
import { WorkflowTemplate, WorkflowStage } from '@/types';
import { useToast } from '@/store/useAppStore';
import { GitFork, Plus, ArrowRight, CheckCircle2, Layers } from 'lucide-react';

export const Workflow: React.FC = () => {
  const toast = useToast();
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [stages, setStages] = useState<{ name: string; color: string; order_index: number }[]>([
    { name: 'Initiation', color: '#737985', order_index: 1 },
    { name: 'Design', color: '#6258E8', order_index: 2 },
    { name: 'Review', color: '#249B70', order_index: 3 },
    { name: 'Delivery', color: '#249B70', order_index: 4 },
  ]);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await getWorkflowTemplates();
      setWorkflows(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStage = () => {
    setStages([
      ...stages,
      {
        name: `Stage ${stages.length + 1}`,
        color: '#6258E8',
        order_index: stages.length + 1,
      },
    ]);
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 2) {
      toast.error('Workflow requires at least 2 stages');
      return;
    }
    setStages(stages.filter((_, idx) => idx !== index));
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName) {
      toast.error('Template name is required');
      return;
    }

    try {
      await createWorkflowTemplate(newTemplateName, newTemplateDesc, stages);
      toast.success('Workflow Created', `Template "${newTemplateName}" created`);
      setIsModalOpen(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      loadWorkflows();
    } catch (err: any) {
      toast.error('Failed to create workflow', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Workflow Engine</h2>
          <p className="text-xs text-secondary mt-0.5">
            Configure lifecycle stages for UI/UX, Development, PDF Formatting and Custom Requests
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Workflow Template
        </Button>
      </div>

      <div className="space-y-4">
        {workflows.map((wf) => (
          <Card key={wf.id} className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-primary">{wf.name}</h3>
                  {wf.is_default && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase">
                      Default
                    </span>
                  )}
                </div>
                {wf.description && (
                  <p className="text-xs text-secondary mt-0.5">{wf.description}</p>
                )}
              </div>
              <span className="text-xs text-secondary font-medium">
                {wf.stages?.length || 0} Stages
              </span>
            </div>

            {/* Stages visual stepper */}
            <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-thin">
              {wf.stages?.map((stage, idx) => (
                <React.Fragment key={stage.id}>
                  <div className="flex items-center gap-2 shrink-0 bg-gray-50 border border-border px-3 py-2 rounded-lg text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: stage.color || '#6258E8' }}
                    />
                    <span className="font-semibold text-primary">{stage.name}</span>
                    <span className="text-[10px] text-secondary font-medium ml-1">
                      #{idx + 1}
                    </span>
                  </div>
                  {idx < (wf.stages?.length || 0) - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* CREATE WORKFLOW MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Workflow Template"
        subtitle="Define custom sequential stages for specific project types"
        size="lg"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Workflow Template Name *
            </label>
            <input
              required
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="e.g. Quick PDF Reformatting Pipeline"
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Description
            </label>
            <input
              value={newTemplateDesc}
              onChange={(e) => setNewTemplateDesc(e.target.value)}
              placeholder="When to apply this workflow..."
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-primary uppercase">
                Workflow Stages ({stages.length})
              </label>
              <button
                type="button"
                onClick={handleAddStage}
                className="text-xs text-accent font-semibold hover:underline"
              >
                + Add Stage
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto p-1">
              {stages.map((stg, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-secondary w-6">#{idx + 1}</span>
                  <input
                    value={stg.name}
                    onChange={(e) => {
                      const updated = [...stages];
                      updated[idx].name = e.target.value;
                      setStages(updated);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Stage Name"
                  />
                  <input
                    type="color"
                    value={stg.color}
                    onChange={(e) => {
                      const updated = [...stages];
                      updated[idx].color = e.target.value;
                      setStages(updated);
                    }}
                    className="w-8 h-8 rounded border border-border cursor-pointer p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStage(idx)}
                    className="text-xs text-danger hover:underline px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
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
              Create Workflow
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

