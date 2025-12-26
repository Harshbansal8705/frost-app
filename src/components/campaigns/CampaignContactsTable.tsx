"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import StatusBadge from "@/components/campaigns/StatusBadge";
import { RemoveContactButton } from "@/components/campaigns/CampaignDetails";
import { Contact, Company, EmailLog } from "@/generated/prisma/client";

type ContactWithDetails = Contact & {
  company: Company;
  emailLogs: EmailLog[];
};

export const CampaignContactsTable = ({ contacts }: { contacts: ContactWithDetails[] }) => {
  const [sortField, setSortField] = useState<"name" | "company" | "status" | "lastSent" | "nextScheduled">("lastSent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: "name" | "company" | "status" | "lastSent" | "nextScheduled") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortValue = (contact: ContactWithDetails, field: typeof sortField) => {
    switch (field) {
      case "name":
        return contact.name.toLowerCase();
      case "company":
        return contact.company.name.toLowerCase();
      case "status":
        return contact.status;
      case "lastSent":
        const lastSent = contact.emailLogs
          .filter((log) => log.status === "SENT")
          .sort((a, b) => b.sequence - a.sequence)[0];
        return lastSent?.sentAt ? new Date(lastSent.sentAt).getTime() : 0;
      case "nextScheduled":
        const nextScheduled = contact.emailLogs
          .filter((log) => log.status === "SCHEDULED")
          .sort((a, b) => b.sequence - a.sequence)[0];
        return nextScheduled?.scheduledAt ? new Date(nextScheduled.scheduledAt).getTime() : 0;
      default:
        return 0;
    }
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    const valA = getSortValue(a, sortField);
    const valB = getSortValue(b, sortField);

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="opacity-30 group-hover:opacity-50" />;
    return <ArrowUpDown size={14} className={`text-cyan-400 transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-x-auto min-h-[400px]">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-medium">
          <tr>
            <th className="px-6 py-3 cursor-pointer group hover:text-white transition-colors" onClick={() => handleSort("name")}>
              <div className="flex items-center gap-2">Contact {renderSortIcon("name")}</div>
            </th>
            <th className="px-6 py-3 cursor-pointer group hover:text-white transition-colors" onClick={() => handleSort("company")}>
              <div className="flex items-center gap-2">Company {renderSortIcon("company")}</div>
            </th>
            <th className="px-6 py-3 cursor-pointer group hover:text-white transition-colors" onClick={() => handleSort("status")}>
              <div className="flex items-center gap-2">Status {renderSortIcon("status")}</div>
            </th>
            <th className="px-6 py-3 cursor-pointer group hover:text-white transition-colors" onClick={() => handleSort("lastSent")}>
              <div className="flex items-center gap-2">Last Sent {renderSortIcon("lastSent")}</div>
            </th>
            <th className="px-6 py-3 cursor-pointer group hover:text-white transition-colors" onClick={() => handleSort("nextScheduled")}>
              <div className="flex items-center gap-2">Next Scheduled {renderSortIcon("nextScheduled")}</div>
            </th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sortedContacts.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                <p>No contacts yet. Add some to get started.</p>
              </td>
            </tr>
          ) : (
            sortedContacts.map((contact) => {
              // const lastLog = contact.emailLogs[0];
              // const isSent = lastLog?.status === "SENT";
              // const isScheduled = lastLog?.status === "SCHEDULED";
              const lastSentLog = contact.emailLogs.filter(log => log.status === "SENT").sort((a, b) => b.sequence - a.sequence)[0];
              const nextScheduledLog = contact.emailLogs.filter(log => log.status === "SCHEDULED").sort((a, b) => b.sequence - a.sequence)[0];

              return (
                <tr key={contact.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{contact.name}</div>
                    <div className="text-slate-500 text-xs">{contact.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {contact.company.name}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={contact.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {lastSentLog ? (
                      <div className="flex flex-col">
                        <span className="text-white/80">
                          {new Date(lastSentLog.sentAt!).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-600">
                          {new Date(lastSentLog.sentAt!).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-700">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {nextScheduledLog ? (
                      <div className="flex flex-col">
                        <span className="text-amber-400/80">
                          {new Date(nextScheduledLog.scheduledAt!).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-600">
                          {new Date(nextScheduledLog.scheduledAt!).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-700">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <RemoveContactButton contactId={contact.id} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
