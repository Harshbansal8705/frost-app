import Link from "next/link";
import { Plus, Search, MoreHorizontal, Mail, Users, ArrowUpRight, Reply, Ban } from "lucide-react";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth-helper";

export default async function CampaignsPage() {
  const session = await authenticateUser();
  const user = session.user

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: {
          contacts: true,
          emailLogs: true
        }
      },
      contacts: {
        select: {
          status: true
        }
      },
      emailLogs: {
        select: {
          status: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Campaigns</h1>
          <p className="text-slate-400 mt-1">Manage and track your email outreach campaigns.</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus size={18} />
          New Campaign
        </Link>
      </div>

      {/* Filters/Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search campaigns..."
            className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
        </div>
      </div>

      {/* Campaigns List */}
      <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-medium">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Contacts</th>
              <th className="px-6 py-4">Sent</th>
              <th className="px-6 py-4">Replied</th>
              <th className="px-6 py-4">Bounced</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                      <Mail size={24} className="opacity-50" />
                    </div>
                    <p>No campaigns found. Create your first one to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => {
                const sentCount = campaign.emailLogs.filter(l => l.status === 'SENT').length;
                const repliedCount = campaign.contacts.filter(c => c.status === 'REPLIED' || c.status === 'RESPONDED_BACK').length;
                const bouncedCount = campaign.contacts.filter(c => c.status === 'BOUNCED').length;

                return (
                  <tr key={campaign.id} className="group hover:bg-white/5 transition-colors relative">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/campaigns/${campaign.id}`} className="absolute inset-0 z-0" />
                      <div className="font-semibold text-white relative z-10 pointer-events-none">{campaign.title}</div>
                    </td>
                    <td className="px-6 py-4 relative z-10">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        Draft
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} />
                        <span>{campaign._count.contacts}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 relative z-10">
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <ArrowUpRight size={14} />
                        <span>{sentCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 relative z-10">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Reply size={14} />
                        <span>{repliedCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 relative z-10">
                      <div className="flex items-center gap-1.5 text-red-400">
                        <Ban size={14} />
                        <span>{bouncedCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 relative z-10">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right relative z-10">
                      <button className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
