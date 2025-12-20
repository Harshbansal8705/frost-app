"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, FileText, Loader2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

export function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    setTemplates(prev => prev.filter(t => t.id !== id)); // Optimistic UI

    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    } catch (err) {
      console.error(err);
      alert("Failed to delete template");
      fetchTemplates();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-center py-10">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Templates</h1>
          <p className="text-slate-400">Manage your reusable email templates.</p>
        </div>
        <Link
          href="/dashboard/templates/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
        >
          <Plus size={18} />
          Create Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-slate-900/50">
          <FileText className="mx-auto text-slate-500 mb-4" size={48} />
          <h3 className="text-lg font-medium text-white mb-2">No templates yet</h3>
          <p className="text-slate-400 mb-6">Create your first template to get started.</p>
          <Link
            href="/dashboard/templates/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-colors"
          >
            Create Template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="group bg-slate-900/50 border border-white/10 hover:border-cyan-500/30 rounded-xl p-6 transition-all relative">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <FileText size={16} />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1 truncate pr-8">{template.name}</h3>
                <p className="text-sm text-slate-400 truncate">Subject: {template.subject}</p>
              </div>

              <div className="text-sm text-slate-500 line-clamp-3 font-mono bg-black/20 p-3 rounded border border-white/5">
                {/* Strip HTML tags for preview roughly */}
                {template.body.replace(/<[^>]*>?/gm, "")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
