"use client";

import { useState } from "react";
import { Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Template, FrostError } from "@/types";
import { Button } from "@/components/ui/Button";

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const deleteTemplate = async () => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new FrostError(data.error || "Failed to delete", res.status);
      }

      // Animate out on success
      setIsDeleted(true);
      // Wait for animation to finish
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success("Template deleted");
      router.refresh();
    } catch (error) {
      // Revert if failed
      setIsDeleted(false);
      setIsDeleting(false);

      if (error instanceof FrostError) {
        toast.error(error.message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete template");
      }
    }
  };

  return (
    <div className={`group bg-slate-900/50 border border-white/10 rounded-xl p-4 md:p-6 transition-all duration-500 relative ${isDeleted
      ? 'opacity-0 scale-90 pointer-events-none' // Animate out
      : isDeleting
        ? 'bg-red-500/5 border-red-500/30 backdrop-blur-sm scale-[0.98] animate-pulse pointer-events-none' // Glass deletion state
        : 'hover:border-cyan-500/30' // Normal state hover effect
      }`}>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <span className="text-xs text-slate-500 font-mono">
            {new Date(template.createdAt).toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-lg font-medium text-white mb-1 truncate pr-8">{template.name}</h3>
        <p className="text-sm text-slate-400 truncate">{template.subject}</p>
      </div>

      <div className="text-sm text-slate-500 line-clamp-3 font-mono bg-black/20 p-3 rounded border border-white/5">
        {/* Strip HTML tags for preview roughly */}
        {template.body.replace(/<[^>]*>?/gm, "")}
      </div>
    </div>
  );
}
