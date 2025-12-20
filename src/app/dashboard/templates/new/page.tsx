"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Paperclip, X } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

export default function NewTemplatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", subject: "", body: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Attachments State
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setAttachments(prev => [...prev, data.url]);
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.body) {
      alert("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, attachments }),
      });

      if (!res.ok) throw new Error("Failed to create template");

      router.push("/dashboard/templates");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard/templates" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4">
          <ArrowLeft size={16} />
          Back to Templates
        </Link>
        <h1 className="text-2xl font-bold text-white">Create New Template</h1>
      </div>

      <div className="bg-slate-950/50 border border-white/10 rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Template Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Initial Outreach"
              className="w-full h-11 rounded-lg bg-black/20 border border-white/10 px-4 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject Line</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Quick question about {{company}}"
              className="w-full h-11 rounded-lg bg-black/20 border border-white/10 px-4 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Body</label>
            <RichTextEditor
              content={formData.body}
              onChange={(html) => setFormData({ ...formData, body: html })}
              placeholder="Hi {{name}}, ..."
            />
          </div>

          {/* Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Attachments</label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleAttachmentUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  disabled={isUploading}
                />
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors pointer-events-none"
                >
                  {isUploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Paperclip size={14} />
                  )}
                  {isUploading ? "Uploading..." : "Add File"}
                </button>
              </div>
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((url, index) => {
                  const fileName = url.split('/').pop()?.replace(/^\d+-/, '') || "Attachment";
                  return (
                    <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg group hover:border-white/20 transition-colors">
                      <Paperclip size={12} className="text-slate-400" />
                      <span className="text-xs text-slate-300 max-w-[150px] truncate" title={fileName}>
                        {fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Template
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
