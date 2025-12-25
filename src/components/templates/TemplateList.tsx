import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Template } from "@/types";
import { TemplateCard } from "./TemplateCard";

interface TemplateListProps {
  templates: Template[];
}

export function TemplateList({ templates }: TemplateListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Email Templates</h1>
          <p className="text-slate-400 text-sm">Manage your reusable email templates.</p>
        </div>
        <Link
          href="/dashboard/templates/new"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
        >
          <Plus size={18} />
          New Template
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}

