"use client";

import { useState } from "react";
import { Status } from "@/generated/prisma/enums";
import { updateContactStatus } from "@/app/dashboard/campaigns/actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  REPLIED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  RESPONDED_BACK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  BOUNCED: "bg-red-500/10 text-red-400 border-red-500/20",
  STOPPED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20"
};

interface ContactStatusCellProps {
  id: string;
  status: Status | string;
}

export default function ContactStatusCell({ id, status: initialStatus }: ContactStatusCellProps) {
  const [status, setStatus] = useState<Status>(initialStatus as Status);
  const [updating, setUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();

    const newStatus = e.target.value as Status;
    setStatus(newStatus);
    setUpdating(true);

    try {
      await updateContactStatus(id, newStatus);
      toast.success("Contact status updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
      setStatus(status);
    } finally {
      setUpdating(false);
    }
  };

  const colorClass = statusColors[status] || statusColors.STOPPED;

  return (
    <div className="relative inline-block z-20" onClick={(e) => e.stopPropagation()}>
      <select
        value={status}
        onChange={handleChange}
        disabled={updating}
        className={`h-7 pl-2 pr-8 text-xs font-medium rounded-full border appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-white/20 transition-colors ${colorClass} bg-transparent`}
      >
        <option value="ACTIVE" className="bg-slate-900 text-blue-400">Active</option>
        <option value="STOPPED" className="bg-slate-900 text-slate-400">Stopped</option>
        <option value="REPLIED" className="bg-slate-900 text-emerald-400">Replied</option>
        <option value="BOUNCED" className="bg-slate-900 text-red-400">Bounced</option>
        <option value="RESPONDED_BACK" className="bg-slate-900 text-emerald-400">Responded Back</option>
      </select>

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
