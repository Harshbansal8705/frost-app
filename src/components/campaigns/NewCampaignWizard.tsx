"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileText, Users, Calendar, Rocket, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

const steps = [
  { id: 1, name: "Setup", icon: FileText },
  { id: 2, name: "Leads", icon: Users },
  { id: 3, name: "Sequence", icon: Rocket },
  { id: 4, name: "Review", icon: Check },
];

export function NewCampaignWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    leads: [],
    sequence: [{ subject: "", body: "", delay: 1 }]
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

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
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-white/20">
              <Users className="text-slate-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Import Contacts</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">Upload a CSV file containing your leads. We'll automatically map the columns.</p>
            <button className="px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors">
              Upload CSV
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-6">Email Sequence</h3>

            <div className="space-y-6">
              {formData.sequence.map((email, idx) => (
                <div key={idx} className="bg-black/20 border border-white/10 rounded-lg p-6 relative group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-slate-500 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mb-4">
                    <span className="text-xs font-medium text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded uppercase tracking-wide">
                      Step {idx + 1}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Subject line"
                    className="w-full bg-transparent border-0 border-b border-white/10 px-0 py-2 text-lg font-medium text-white placeholder-slate-500 focus:ring-0 focus:border-cyan-500 mb-4"
                  />
                  <textarea
                    placeholder="Hi {{firstName}}, ..."
                    className="w-full h-32 bg-transparent border-0 resize-none text-slate-300 placeholder-slate-600 focus:ring-0"
                  />
                </div>
              ))}

              <button className="w-full py-4 border-2 border-dashed border-white/10 rounded-lg text-slate-500 hover:border-cyan-500/30 hover:text-cyan-400 transition-all flex items-center justify-center gap-2">
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
                <span className="text-white font-medium">0</span>
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
      <div className="mt-8 flex items-center justify-between">
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
          onClick={nextStep}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all"
        >
          {currentStep === 4 ? "Launch Campaign" : "Continue"}
          {currentStep !== 4 && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
}
