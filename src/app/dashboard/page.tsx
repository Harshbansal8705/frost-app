import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  let totalSent = 0;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user) {
      totalSent = await prisma.emailLog.count({
        where: {
          campaign: {
            userId: user.id
          },
          status: 'SENT'
        }
      });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back, here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sent", value: totalSent.toLocaleString(), change: "+0%", trend: "up" }, // Real number
          { label: "Open Rate", value: "0%", change: "0%", trend: "neutral" },         // Dummy/Fallback
          { label: "Reply Rate", value: "0%", change: "0%", trend: "neutral" },        // Dummy/Fallback
          { label: "Opportunities", value: "0", change: "0", trend: "neutral" },      // Dummy/Fallback
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-xl border border-white/5 bg-white/5 hover:border-cyan-500/30 transition-all cursor-default">
            <p className="text-sm font-medium text-slate-400">{stat.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{stat.value}</span>
              {stat.change !== "0%" && stat.change !== "0" && (
                <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-400' : stat.trend === 'down' ? 'text-red-400' : 'text-slate-500'}`}>
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Mockup */}
      <div className="rounded-xl border border-white/5 bg-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="p-6 text-center text-slate-500 py-20">
          <p>No campaigns running currently.</p>
          <button className="mt-4 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors">
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}
