'use client';

import { useOptimistic, useTransition, useState } from "react";
import { LayoutTemplate, Clock, Trash2 } from "lucide-react";
import { AddTemplateDropdown } from "./CampaignDetails";
import { Template } from "@/types";
import {
  addTemplateToCampaign,
  removeCampaignTemplate,
  updateCampaignTemplateDelay
} from "@/app/dashboard/campaigns/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

type CampaignTemplateWithDetails = {
  id: string;
  sequence: number;
  delay: number;
  template: Template;
};

type Action =
  | { type: 'ADD'; payload: CampaignTemplateWithDetails }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE_DELAY'; id: string; delay: number };

function StepItem({
  step,
  index,
  isLast,
  onRemove,
  onDelayUpdate,
  isOptimistic
}: {
  step: CampaignTemplateWithDetails;
  index: number;
  isLast: boolean;
  onRemove: (id: string) => void;
  onDelayUpdate: (id: string, delay: number) => void;
  isOptimistic?: boolean;
}) {
  const [delay, setDelay] = useState(step.delay.toString());

  const handleBlur = () => {
    const val = parseInt(delay);
    if (!isNaN(val) && val !== step.delay) {
      onDelayUpdate(step.id, val);
    } else {
      setDelay(step.delay.toString()); // Reset if invalid
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border border-white/10 bg-slate-900/50 flex flex-col gap-2 group hover:border-white/20 transition-all ${isOptimistic ? 'opacity-70 animate-pulse' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {index === 0 ? "First Mail" : `Follow Up ${index}`}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/20 rounded px-2 py-0.5 border border-white/5">
            <Clock size={12} className="text-slate-500" />
            <span className="text-xs text-slate-500">Wait</span>
            <input
              type="text"
              value={delay}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) setDelay(val);
              }}
              onBlur={handleBlur}
              className="w-8 bg-transparent text-xs text-center focus:outline-none text-white font-mono"
            />
            <span className="text-xs text-slate-500">days</span>
          </div>

          {isLast && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(step.id)}
              className="h-6 w-6 text-slate-600 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={12} />
            </Button>
          )}
        </div>
      </div>
      <div className="font-medium text-white">{step.template.name}</div>
      <div className="text-sm text-slate-400 truncate">{step.template.subject}</div>
    </div>
  );
}

export function CampaignSteps({
  campaignId,
  initialSteps,
  allTemplates
}: {
  campaignId: string;
  initialSteps: CampaignTemplateWithDetails[];
  allTemplates: Template[];
}) {
  const [optimisticSteps, dispatch] = useOptimistic(
    initialSteps,
    (state, action: Action) => {
      switch (action.type) {
        case 'ADD': return [...state, action.payload];
        case 'REMOVE': return state.filter(s => s.id !== action.id);
        case 'UPDATE_DELAY': return state.map(s => s.id === action.id ? { ...s, delay: action.delay } : s);
        default: return state;
      }
    }
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
      dispatch({ type: 'ADD', payload: newStep });
      try {
        await addTemplateToCampaign(campaignId, templateId);
        toast.success("Step added");
      } catch (error) {
        console.error(error);
        toast.error("Failed to add step");
      }
    });
  };

  const handleRemove = (id: string) => {
    if (id.startsWith('temp-')) return;

    if (!confirm("Are you sure you want to remove this step?")) return;

    startTransition(async () => {
      dispatch({ type: 'REMOVE', id });
      try {
        await removeCampaignTemplate(id);
        toast.success("Step removed");
      } catch (error) {
        console.error(error);
        toast.error("Failed to remove step");
      }
    });
  };

  const handleDelayUpdate = (id: string, delay: number) => {
    if (id.startsWith('temp-')) return;

    startTransition(async () => {
      dispatch({ type: 'UPDATE_DELAY', id, delay });
      try {
        await updateCampaignTemplateDelay(id, delay);
        toast.success("Delay updated");
      } catch (error) {
        console.error(error);
        toast.error("Failed to update delay");
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
            <StepItem
              key={ct.id}
              step={ct}
              index={index}
              isLast={index === optimisticSteps.length - 1}
              onRemove={handleRemove}
              onDelayUpdate={handleDelayUpdate}
              isOptimistic={ct.id.startsWith('temp-')}
            />
          ))
        )}
      </div>
    </div>
  );
}
