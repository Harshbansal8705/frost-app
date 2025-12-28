'use client';

import { useOptimistic, useTransition, useState } from "react";
import { LayoutTemplate, Clock, Trash2, CornerDownRight } from "lucide-react";
import { AddTemplateDropdown } from "./CampaignDetails";
import { Template } from "@/types";
import { useFrostFetch } from "@/hooks/useFrostFetch";
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
          {index > 0 && (
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
          )}

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
      <div className="flex flex-col gap-1 mt-0.5">
        <div className="flex items-center gap-2 text-sm overflow-hidden">
          <span className="text-slate-500 shrink-0">Subject:</span>
          <span className={`truncate ${index > 0 ? "line-through opacity-50 text-slate-500" : "text-slate-300"}`}>
            {step.template.subject}
          </span>
          {index === 0 && (
            <span className="shrink-0 text-[10px] font-medium text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
              Thread Subject
            </span>
          )}
        </div>
        {index > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-1">
            <CornerDownRight size={12} className="opacity-50" />
            <span>Subject ignored • Sends as reply to thread</span>
          </div>
        )}
      </div>
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

  const { frostFetch } = useFrostFetch();

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
      delay: 1, // Default delay
      template: template
    };

    startTransition(async () => {
      dispatch({ type: 'ADD', payload: newStep });
      await frostFetch<null>(`/api/campaigns/${campaignId}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
        onSuccess: () => {
          toast.success("Step added");
        },
      });
    });
  };

  const handleRemove = (id: string) => {
    if (id.startsWith('temp-')) return;

    if (!confirm("Are you sure you want to remove this step?")) return;

    startTransition(async () => {
      dispatch({ type: 'REMOVE', id });
      await frostFetch<null>(`/api/campaigns/templates/${id}`, {
        method: "DELETE",
        onSuccess: () => {
          toast.success("Step removed");
        },
      });
    });
  };

  const handleDelayUpdate = (id: string, delay: number) => {
    if (id.startsWith('temp-')) return;

    startTransition(async () => {
      dispatch({ type: 'UPDATE_DELAY', id, delay });
      await frostFetch<null>(`/api/campaigns/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delay }),
        onSuccess: () => {
          toast.success("Delay updated");
        },
      });
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
