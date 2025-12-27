"use client";

import { useState } from "react";
import { CampaignStatus } from "@/generated/prisma/client"; // Adjust import based on where enums are
import { updateCampaign } from "@/app/dashboard/campaigns/actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used, or basic alert

// Map colors based on status (reusing logic from StatusBadge ideally)
const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  // Contact statuses
  replied: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  bounced: "bg-red-500/10 text-red-400 border-red-500/20",
  stopped: "bg-red-500/10 text-red-400 border-red-500/20",
  responded_back: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

interface CampaignStatusCellProps {
  id: string;
  status: CampaignStatus;
}

export default function CampaignStatusCell({ id, status: initialStatus }: CampaignStatusCellProps) {
  const [status, setStatus] = useState<CampaignStatus>(initialStatus);
  const [updating, setUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Prevent event from bubbling if it's inside a row click handler
    e.stopPropagation();

    const newStatus = e.target.value as CampaignStatus;
    setStatus(newStatus); // Optimistic update
    setUpdating(true);

    try {
      await updateCampaign(id, { status: newStatus });
      toast.success("Campaign status updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
      setStatus(status); // Revert
    } finally {
      setUpdating(false);
    }
  };

  const colorClass = statusColors[status.toLowerCase()] || statusColors.draft;

  return (
    <div className="relative inline-block z-20" onClick={(e) => e.stopPropagation()}>
      <select
        value={status}
        onChange={handleChange}
        disabled={updating}
        className={`h-7 pl-2 pr-8 text-xs font-medium rounded-full border appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-white/20 transition-colors ${colorClass} bg-transparent`}
      >
        <option value="DRAFT" className="bg-slate-900 text-slate-400">Draft</option>
        <option value="ACTIVE" className="bg-slate-900 text-emerald-400">Active</option>
      </select>

      {/* Custom Arrow / Loader */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
        {updating ? (
          <Loader2 size={10} className="animate-spin opacity-70" />
        ) : (
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-4 border-t-current opacity-50" />
        )}
      </div>
    </div>
  );
}
