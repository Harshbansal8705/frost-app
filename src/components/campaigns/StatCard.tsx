import type { LucideIcon } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: LucideIcon, color: string }) {
  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg ${color} flex items-center justify-center text-white`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
