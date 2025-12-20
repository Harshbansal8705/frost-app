"use client";

import { useState, useRef } from "react";
import { ArrowLeft, ArrowRight, Check, FileText, Users, Calendar, Rocket, Plus, Trash2, Upload, Loader2, Bold, Italic, Paperclip, X } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

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
    sequence: [{ subject: "", body: "", delay: 0, attachments: [] as string[] }]
  });

  // Manual Entry State
  const [newLead, setNewLead] = useState({ name: "", email: "", company: "" });

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
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

  // --- File Upload ---
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>, stepIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { url } = await res.json();

      const newSequence = [...formData.sequence];
      newSequence[stepIndex].attachments = [...(newSequence[stepIndex].attachments || []), url];
      setFormData(prev => ({ ...prev, sequence: newSequence }));

    } catch (err: any) {
      console.error(err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      // Construct a new file input to allow re-uploading same file if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (stepIndex: number, attachIndex: number) => {
    const newSequence = [...formData.sequence];
    newSequence[stepIndex].attachments = newSequence[stepIndex].attachments.filter((_, i) => i !== attachIndex);
    setFormData(prev => ({ ...prev, sequence: newSequence }));
  };


  // --- Sequence Management ---
  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      sequence: [...prev.sequence, { subject: "", body: "", delay: 2, attachments: [] }]
    }));
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
              {formData.sequence.map((step, idx) => (
                <div key={idx} className="bg-black/20 border border-white/10 rounded-lg p-6 relative group">
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

                  <input
                    type="text"
                    value={step.subject}
                    onChange={(e) => updateStep(idx, "subject", e.target.value)}
                    placeholder="Subject line"
                    className="w-full bg-transparent border-0 border-b border-white/10 px-0 py-2 text-lg font-medium text-white placeholder-slate-500 focus:ring-0 focus:border-cyan-500 mb-4 outline-none"
                  />

                  <div className="mb-4">
                    <RichTextEditor
                      content={step.body}
                      onChange={(html) => updateStep(idx, "body", html)}
                      placeholder="Hi {{firstName}}, ..."
                    />
                  </div>

                  {/* Attachments Section */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-colors">
                        <Paperclip size={14} />
                        <span>Attach File</span>
                        <input
                          type="file"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={(e) => handleAttachmentUpload(e, idx)}
                          disabled={isUploading}
                        />
                      </label>
                      {isUploading && <Loader2 size={14} className="animate-spin text-cyan-400" />}
                    </div>

                    {/* Attachment List */}
                    {step.attachments && step.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                        {step.attachments.map((url, i) => (
                          <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-xs text-slate-300">
                            <Paperclip size={12} className="text-cyan-400" />
                            <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline max-w-[150px] truncate">
                              {url.split('/').pop()}
                            </a>
                            <button onClick={() => removeAttachment(idx, i)} className="text-slate-500 hover:text-red-400 ml-1">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={addStep}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-lg text-slate-500 hover:border-cyan-500/30 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Follow-up
              </button>
            </div>
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
