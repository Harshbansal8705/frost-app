'use client';

import { useOptimistic, useTransition } from "react";
import { LayoutTemplate, Clock } from "lucide-react";
import { AddTemplateDropdown } from "./CampaignDetails";
import { Template } from "@/types";
import { addTemplateToCampaign } from "@/app/dashboard/campaigns/actions";
import { toast } from "sonner";

type CampaignTemplateWithDetails = {
  id: string;
  sequence: number;
  delay: number;
  template: Template;
};

export function CampaignSteps({
  campaignId,
  initialSteps,
  allTemplates
}: {
  campaignId: string;
  initialSteps: CampaignTemplateWithDetails[];
  allTemplates: Template[];
}) {
  const [optimisticSteps, addOptimisticStep] = useOptimistic(
    initialSteps,
    (state, newStep: CampaignTemplateWithDetails) => [...state, newStep]
  );

  const [, startTransition] = useTransition();

  const handleAddTemplate = async (templateId: string) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return;

    const nextSequence = (optimisticSteps.length > 0
      ? Math.max(...optimisticSteps.map(s => s.sequence))
      : 0) + 1;

    // Optimistically add the step
    const newStep: CampaignTemplateWithDetails = {
      id: `temp-${Date.now()}`, // Temporary ID
      sequence: nextSequence,
      delay: 1, // Default delay, adjust as per logic
      template: template
    };

    startTransition(async () => {
      addOptimisticStep(newStep);
      try {
        await addTemplateToCampaign(campaignId, templateId);
        toast.success("Step added");
      } catch (error) {
        console.error(error);
        toast.error("Failed to add step");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Sequence</h2>
        <AddTemplateDropdown
          campaignId={campaignId}
          allTemplates={allTemplates}
          onAdd={handleAddTemplate}
        />
      </div>

      <div className="flex flex-col gap-3">
        {optimisticSteps.length === 0 ? (
          <div className="p-6 rounded-xl border border-white/10 bg-slate-900/50 text-center text-slate-500">
            <LayoutTemplate size={20} className="mx-auto mb-2 opacity-50" />
            <p>No templates in sequence.</p>
          </div>
        ) : (
          optimisticSteps.map((ct, index) => (
            <div
              key={ct.id}
              className={`p-4 rounded-xl border border-white/10 bg-slate-900/50 flex flex-col gap-2 group hover:border-white/20 transition-all ${ct.id.startsWith('temp-') ? 'opacity-70 animate-pulse' : ''
                }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {index === 0 ? "First Mail" : `Follow Up ${index}`}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={12} />
                  Wait {ct.delay} day{ct.delay !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="font-medium text-white">{ct.template.name}</div>
              <div className="text-sm text-slate-400 truncate">{ct.template.subject}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
