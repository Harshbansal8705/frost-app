"use client";

import { useState } from "react";
import { Pencil, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Template } from "@/types";
import { Button } from "@/components/ui/Button";
import { useFrostFetch } from "@/hooks/useFrostFetch";

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const { frostFetch } = useFrostFetch();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const deleteTemplate = async () => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    setIsDeleting(true);

    await frostFetch<null>(`/api/templates/${template.id}`, {
      method: "DELETE",
      onSuccess: async () => {
        setIsDeleted(true);
        toast.success("Template deleted");
      },
      onError: () => {
        setIsDeleted(false);
        setIsDeleting(false);
      }
    });
  };

  return (
    <div className={`group bg-slate-900/50 border border-white/10 rounded-xl p-4 md:p-6 transition-all duration-500 relative ${isDeleted
      ? 'opacity-0 scale-90 pointer-events-none'
      : isDeleting
        ? 'bg-red-500/5 border-red-500/30 backdrop-blur-sm scale-[0.98] animate-pulse pointer-events-none'
        : 'hover:border-cyan-500/30'
      }`}>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <Link href={`/dashboard/templates/${template.id}`}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            <Pencil size={16} />
          </Button>
        </Link>
        <Button
          onClick={deleteTemplate}
          disabled={isDeleting}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <FileText size={16} />
          </div>
          <span className="text-base font-semibold text-white truncate">
            {template.name}
          </span>
        </div>
        <h3 className="text-sm text-slate-400 mb-1 truncate pr-8">{template.subject}</h3>
      </div>

      <div className="text-sm text-slate-500 line-clamp-3 font-mono bg-black/20 p-3 rounded border border-white/5">
        {/* Strip HTML tags for preview roughly */}
        {template.body.replace(/<[^>]*>?/gm, "")}
      </div>
    </div>
  );
}
