import prisma from "@/lib/prisma";
import Link from "next/link";
import { authenticateUser } from "@/lib/auth-helper";
import { EmailLogStatus, CampaignStatus, Status } from "@/generated/prisma/enums";
import StatCard from "@/components/campaigns/StatCard";
import { Mail, Play, Reply, Ban } from "lucide-react";

export default async function DashboardPage() {
  const session = await authenticateUser();
  const userId = session.user.id;

  const [activeCampaigns, totalSent, repliedCount, bouncedCount] = await Promise.all([
    prisma.campaign.count({
      where: { userId, status: CampaignStatus.ACTIVE }
    }),
    prisma.emailLog.count({
      where: { campaign: { userId }, status: EmailLogStatus.SENT }
    }),
    prisma.contact.count({
      where: { userId, status: { in: [Status.REPLIED, Status.RESPONDED_BACK] } }
    }),
    prisma.contact.count({
      where: { userId, status: Status.BOUNCED }
    })
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back, here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={Play}
          color="bg-purple-500/10 text-purple-400 border-purple-500/20"
        />
        <StatCard
          title="Total Sent"
          value={totalSent}
          icon={Mail}
          color="bg-blue-500/10 text-blue-400 border-blue-500/20"
        />
        <StatCard
          title="Total Replies"
          value={repliedCount}
          icon={Reply}
          color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        />
        <StatCard
          title="Total Bounced"
          value={bouncedCount}
          icon={Ban}
          color="bg-red-500/10 text-red-400 border-red-500/20"
        />
      </div>

      {/* Recent Activity Mockup */}
      <div className="rounded-xl border border-white/5 bg-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="p-6 text-center text-slate-500 py-20">
          <p>Start a new campaign to see activity here.</p>
          <Link href="/dashboard/campaigns/new" className="inline-block mt-8 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors">
            Create Campaign
          </Link>
        </div>
      </div>
    </div>
  );
}
