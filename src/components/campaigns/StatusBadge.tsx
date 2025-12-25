import { CampaignStatus, Status } from "@/generated/prisma/enums";

export default function StatusBadge({ status }: { status: CampaignStatus | Status }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    PAUSED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
    REPLIED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    RESPONDED_BACK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    BOUNCED: "bg-red-500/10 text-red-400 border-red-500/20",
    STOPPED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    FAILED: "bg-red-500/10 text-red-400 border-red-500/20"
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
