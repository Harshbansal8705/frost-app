"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Check, FileText, Users, Rocket, Plus, Trash2, Loader2, Paperclip, X } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TemplateForm } from "@/components/templates/TemplateForm";

const steps = [
  { id: 1, name: "Setup", icon: FileText },
  { id: 2, name: "Leads", icon: Users },
  { id: 3, name: "Sequence", icon: Rocket },
  { id: 4, name: "Review", icon: Check },
];

export function NewCampaignWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    leads: [] as { name: string; email: string; company: string }[],
    sequence: [] as { id: string; templateId: string; subject: string; body: string; delay: number; attachments: string[] }[]
  });

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);

  // Manual Entry State
  const [newLead, setNewLead] = useState({ name: "", email: "", company: "" });

  // Templates State
  const [templates, setTemplates] = useState<{ id: string; name: string; subject: string; body: string; attachments: string[] }[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = () => {
    fetch("/api/templates")
      .then(res => res.json())
      .then(data => setTemplates(data))
      .catch(err => console.error("Failed to load templates", err));
  };

  const loadTemplate = (stepIndex: number, templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // If step exists and has template, confirm replacement
    if (formData.sequence[stepIndex] && formData.sequence[stepIndex].templateId && !confirm("Replace current template?")) return;

    const newSequence = [...formData.sequence];

    if (stepIndex === newSequence.length) {
      // Adding new step
      newSequence.push({
        id: `temp-${Date.now()}`,
        templateId: template.id,
        subject: template.subject,
        body: template.body,
        attachments: template.attachments || [],
        delay: stepIndex === 0 ? 0 : 2
      });
      setIsAddingStep(false);
    } else {
      // Updating existing step
      newSequence[stepIndex] = {
        ...newSequence[stepIndex],
        templateId: template.id,
        subject: template.subject,
        body: template.body,
        attachments: template.attachments || []
      };
    }

    setFormData(prev => ({ ...prev, sequence: newSequence }));
  };

  const handleTemplateCreated = (newTemplate: any) => {
    setTemplates(prev => [newTemplate, ...prev]);
    setIsTemplateModalOpen(false);

    if (activeStepIndex !== null) {
      loadTemplate(activeStepIndex, newTemplate.id);
      setActiveStepIndex(null);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.name.trim()) {
      alert("Please enter a campaign name");
      return;
    }
    if (currentStep === 3 && formData.sequence.length === 0) {
      alert("Please add at least one email to your sequence");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // --- Manual Lead Entry ---
  const addLead = () => {
    if (!newLead.email) return;
    setFormData(prev => ({
      ...prev,
      leads: [...prev.leads, newLead]
    }));
    setNewLead({ name: "", email: "", company: "" });
  };

  const removeLead = (index: number) => {
    setFormData(prev => ({
      ...prev,
      leads: prev.leads.filter((_, i) => i !== index)
    }));
  };

  // --- Sequence Management ---
  const addStep = () => {
    setIsAddingStep(true);
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sequence: prev.sequence.filter((_, i) => i !== index)
    }));
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSequence = [...formData.sequence];
    newSequence[index] = { ...newSequence[index], [field]: value };
    setFormData(prev => ({ ...prev, sequence: newSequence }));
  };



  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create campaign");
      }

      router.push("/dashboard/campaigns");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Wizard Header / Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/10 -z-10" />
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-slate-950 px-4">
                <div
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted ? "bg-cyan-500 border-cyan-500 text-white" :
                      isCurrent ? "bg-slate-900 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]" :
                        "bg-slate-900 border-white/10 text-slate-500"
                  )}
                >
                  <step.icon size={18} />
                </div>
                <span className={clsx(
                  "text-xs font-medium uppercase tracking-wider",
                  isCurrent ? "text-cyan-400" : "text-slate-500"
                )}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-8 min-h-[400px]">
        {currentStep === 1 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Name your campaign</h2>
            <p className="text-slate-400 mb-8 text-center">Give your campaign a memorable name so you can find it later.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Campaign Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Q1 Outreach - SaaS Companies"
                  className="w-full h-11 rounded-lg bg-black/20 border border-white/10 px-4 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Add Leads</h3>
              <p className="text-slate-400">Manually add contacts to your campaign.</p>
            </div>

            {/* Manual Entry Form */}
            <div className="flex gap-3 mb-8 bg-black/20 p-4 rounded-xl border border-white/5 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                <input
                  value={newLead.name}
                  onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full h-9 rounded bg-white/5 border border-white/10 px-3 text-sm text-white focus:border-cyan-500/50 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <input
                  value={newLead.email}
                  onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                  className="w-full h-9 rounded bg-white/5 border border-white/10 px-3 text-sm text-white focus:border-cyan-500/50 outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Company</label>
                <input
                  value={newLead.company}
                  onChange={e => setNewLead({ ...newLead, company: e.target.value })}
                  className="w-full h-9 rounded bg-white/5 border border-white/10 px-3 text-sm text-white focus:border-cyan-500/50 outline-none"
                  placeholder="Acme Inc."
                />
              </div>
              <button
                onClick={addLead}
                disabled={!newLead.email}
                className="h-9 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            {/* List */}
            {formData.leads.length > 0 ? (
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-white/5 text-slate-300 font-medium">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {formData.leads.map((lead, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5 text-white">{lead.name}</td>
                        <td className="px-4 py-2.5">{lead.email}</td>
                        <td className="px-4 py-2.5">{lead.company}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => removeLead(i)} className="text-slate-500 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-lg">
                <p className="text-slate-500 text-sm">No leads added yet.</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-6">Email Sequence</h3>

            <div className="space-y-6">
              {formData.sequence.map((step, idx) => {
                const linkedTemplate = templates.find(t => t.id === step.templateId);

                return (
                  <div key={step.id || idx} className="bg-black/20 border border-white/10 rounded-lg p-6 relative group">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => removeStep(idx)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded uppercase tracking-wide">
                        {idx === 0 ? "First Mail" : `Follow Up ${idx}`}
                      </span>

                      {idx > 0 && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span>Wait</span>
                          <input
                            type="number"
                            value={step.delay}
                            onChange={(e) => updateStep(idx, "delay", parseInt(e.target.value))}
                            className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-center"
                          />
                          <span>days</span>
                        </div>
                      )}
                    </div>

                    {/* Template Selection */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Linked Template</label>
                      <div className="flex gap-2">
                        <select
                          value={step.templateId}
                          onChange={(e) => {
                            if (e.target.value === "NEW") {
                              setActiveStepIndex(idx);
                              setIsTemplateModalOpen(true);
                            } else {
                              loadTemplate(idx, e.target.value);
                            }
                          }}
                          className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                        >
                          <option value="" disabled>Select a template...</option>
                          <option value="NEW">+ Create New Template</option>
                          <option disabled>──────────</option>
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Preview of Linked Template */}
                    {linkedTemplate ? (
                      <div className="bg-white/5 rounded border border-white/5 p-4">
                        <div className="mb-2">
                          <span className="text-xs text-slate-500 uppercase">Subject</span>
                          <div className="text-sm font-medium text-white">{linkedTemplate.subject}</div>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 uppercase">Body Preview</span>
                          <div className="text-sm text-slate-400 line-clamp-2">{linkedTemplate.body.replace(/<[^>]*>?/gm, "")}</div>
                        </div>
                        {linkedTemplate.attachments.length > 0 && (
                          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                            <Paperclip size={12} />
                            {linkedTemplate.attachments.length} Attachment(s)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-white/10 rounded">
                        <p className="text-sm text-slate-500">No template selected.</p>
                      </div>
                    )}

                  </div>
                );
              })}

              {/* Selector for adding a new step */}
              {isAddingStep && (
                <div className="bg-black/20 border border-cyan-500/30 rounded-lg p-6 relative animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded uppercase tracking-wide">
                      {formData.sequence.length === 0 ? "First Mail" : `Follow Up ${formData.sequence.length}`}
                    </span>
                    <button
                      onClick={() => setIsAddingStep(false)}
                      className="text-slate-500 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Select Template</label>
                    <select
                      autoFocus
                      value=""
                      onChange={(e) => {
                        if (e.target.value === "NEW") {
                          setActiveStepIndex(formData.sequence.length);
                          setIsTemplateModalOpen(true);
                        } else {
                          loadTemplate(formData.sequence.length, e.target.value);
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                    >
                      <option value="" disabled>Choose a template...</option>
                      <option value="NEW">+ Create New Template</option>
                      <option disabled>──────────</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {!isAddingStep && (
                <button
                  onClick={addStep}
                  className="w-full py-4 border-2 border-dashed border-white/10 rounded-lg text-slate-500 hover:border-cyan-500/30 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {formData.sequence.length === 0 ? "Add First Mail" : "Add Follow-up"}
                </button>
              )}
            </div>


            {/* Template Creation Modal */}
            {isTemplateModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                    <h3 className="text-lg font-bold text-white">Create New Template</h3>
                    <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-500 hover:text-white">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-6">
                    <TemplateForm
                      onSuccess={handleTemplateCreated}
                      onCancel={() => setIsTemplateModalOpen(false)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to launch?</h2>
            <p className="text-slate-400 mb-8">Review your campaign settings before starting.</p>

            <div className="bg-white/5 rounded-lg border border-white/10 p-6 max-w-md mx-auto text-left space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Campaign Name</span>
                <span className="text-white font-medium">{formData.name || "Untitled"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Leads</span>
                <span className="text-white font-medium">{formData.leads.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Steps</span>
                <span className="text-white font-medium">{formData.sequence.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer */}
      <div className="mt-8">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </div>
        )}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/campaigns"
            className="text-slate-500 hover:text-white transition-colors"
            hidden={currentStep > 1}
          >
            Cancel
          </Link>
          <button
            onClick={prevStep}
            className="px-6 py-2.5 text-slate-300 hover:text-white transition-colors"
            hidden={currentStep === 1}
          >
            Back
          </button>
          <button
            onClick={currentStep === 4 ? handleSubmit : nextStep}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Launching...
              </>
            ) : (
              <>
                {currentStep === 4
                  ? "Launch Campaign"
                  : (currentStep === 2 && formData.leads.length === 0 ? "Skip for now" : "Continue")
                }
                {currentStep !== 4 && <ArrowRight size={18} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
