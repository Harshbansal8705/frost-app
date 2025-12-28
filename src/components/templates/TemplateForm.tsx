"use client";

import { useState } from "react";
import { Save, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Template } from "@/types";
import { Button } from "@/components/ui/Button";
import { useFrostFetch } from "@/hooks/useFrostFetch";

interface TemplateFormProps {
  initialData?: {
    name: string;
    subject: string;
    body: string;
    attachments: string[];
  };
  templateId?: string;
  onSuccess: (template: Template) => void;
  onCancel?: () => void;
}

export function TemplateForm({ initialData, templateId, onSuccess, onCancel }: TemplateFormProps) {
  const [formData, setFormData] = useState(initialData || { name: "", subject: "", body: "" });
  const [attachments, setAttachments] = useState<string[]>(initialData?.attachments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { frostFetch } = useFrostFetch();

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    await frostFetch<{ url: string }>("/api/upload", {
      method: "POST",
      body: uploadFormData,
      onSuccess: (data) => {
        setAttachments(prev => [...prev, data.url]);
      }
    });
    setIsUploading(false);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.body) {
      toast.error("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const url = templateId ? `/api/templates/${templateId}` : "/api/templates";
      const method = templateId ? "PUT" : "POST";

      await frostFetch<Template>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, attachments }),
        onSuccess: (data) => {
          toast.success("Template saved");
          onSuccess(data);
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save template";
      toast.error(message);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-transparent p-0 h-auto pointer-events-none"
            >
              {isUploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Paperclip size={14} />
              )}
              {isUploading ? "Uploading..." : "Add File"}
            </Button>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttachment(index)}
                    className="text-slate-500 hover:text-red-400 hover:bg-transparent h-5 w-5"
                  >
                    <X size={12} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="px-4 py-2 text-slate-400 hover:text-white"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="gap-2 px-6 py-2.5 shadow-lg shadow-cyan-500/20 h-auto"
        >
          {!isSubmitting && <Save size={18} />}
          {isSubmitting ? "Saving..." : "Save Template"}
        </Button>
      </div>
    </form>
  );
}
