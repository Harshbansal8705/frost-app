import Link from "next/link";
import { ArrowLeft, Users, Send, Reply, Ban } from "lucide-react";
import prisma from "@/lib/prisma";
import { ContactsActions, RemoveContactButton, EditCampaignTitle } from "@/components/campaigns/CampaignDetails";
import { CampaignSteps } from "@/components/campaigns/CampaignSteps";
import StatusBadge from "@/components/campaigns/StatusBadge";
import StatCard from "@/components/campaigns/StatCard";
import { authenticateUser } from "@/lib/auth-helper";


export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await authenticateUser();

  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: session.user.id },
    include: {
      templates: {
        include: {
          template: true
        },
        orderBy: { sequence: 'asc' }
      },
      contacts: {
        include: {
          company: true,
          emailLogs: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      },
      emailLogs: true
    }
  });

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Campaign Not Found</h2>
        <Link href="/dashboard/campaigns" className="text-cyan-400 hover:underline">Return to Campaigns</Link>
      </div>
    );
  }

  const sentCount = campaign.emailLogs.filter(l => l.status === 'SENT').length;
  const repliedCount = campaign.contacts.filter(c => c.status === 'REPLIED' || c.status === 'RESPONDED_BACK').length;
  const bouncedCount = campaign.contacts.filter(c => c.status === 'BOUNCED').length;

  // Available templates for the dropdown
  const rawTemplates = await prisma.template.findMany({
    where: { userId: session.user.id }
  });

  const allTemplates = rawTemplates.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString()
  }));

  const initialSteps = campaign.templates.map(ct => ({
    ...ct,
    template: {
      ...ct.template,
      createdAt: ct.template.createdAt.toISOString(),
      updatedAt: ct.template.updatedAt.toISOString()
    }
  }));


  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/campaigns" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm w-fit transition-colors">
          <ArrowLeft size={16} />
          Back to Campaigns
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <EditCampaignTitle campaignId={campaign.id} initialTitle={campaign.title} initialStatus={campaign.status} />
            <p className="text-slate-400 mt-1">Created on {new Date(campaign.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Contacts" value={campaign.contacts.length} icon={Users} color="bg-blue-600/20" />
        <StatCard title="Emails Sent" value={sentCount} icon={Send} color="bg-indigo-600/20" />
        <StatCard title="Replied" value={repliedCount} icon={Reply} color="bg-emerald-600/20" />
        <StatCard title="Bounced" value={bouncedCount} icon={Ban} color="bg-red-600/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Contacts (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Contacts</h2>
            <ContactsActions campaignId={campaign.id} />
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Sent</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaign.contacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <p>No contacts yet. Add some to get started.</p>
                    </td>
                  </tr>
                ) : (
                  campaign.contacts.map(contact => (
                    <tr key={contact.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{contact.name}</div>
                        <div className="text-slate-500 text-xs">{contact.email}</div>
                        <div className="text-slate-500 text-xs">{contact.company.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={contact.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {contact.emailLogs[0]?.sentAt ? (
                          <div className="flex flex-col">
                            <span>{new Date(contact.emailLogs[0].sentAt).toLocaleDateString()}</span>
                            <span className="text-xs text-slate-600">{new Date(contact.emailLogs[0].sentAt).toLocaleTimeString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-700">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RemoveContactButton contactId={contact.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Templates (1/3 width) */}
        <div className="flex flex-col gap-4">
          <CampaignSteps
            campaignId={campaign.id}
            initialSteps={initialSteps}
            allTemplates={allTemplates}
          />
        </div>
      </div>
    </div>
  );
}
