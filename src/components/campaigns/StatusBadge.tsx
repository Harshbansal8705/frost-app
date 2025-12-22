import { Status } from "@/generated/prisma/enums";

export default function StatusBadge({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    ACTIVE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    REPLIED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    RESPONDED_BACK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    BOUNCED: "bg-red-500/10 text-red-400 border-red-500/20",
    STOPPED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    FAILED: "bg-red-500/10 text-red-400 border-red-500/20"
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.ACTIVE}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
