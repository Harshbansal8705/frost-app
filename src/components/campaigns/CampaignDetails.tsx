'use client';

import { useState } from "react";
import { Plus, Trash2, FilePlus } from "lucide-react";
import { addContactToCampaign, removeContactFromCampaign, addTemplateToCampaign, updateCampaign } from "@/app/dashboard/campaigns/actions";
import { FrostError, Template } from "@/types";
import { toast } from "sonner";
import { TemplateForm } from "@/components/templates/TemplateForm";

export const EditCampaignTitle = ({ campaignId, initialTitle }: { campaignId: string, initialTitle: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title === initialTitle) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCampaign(campaignId, { title });
      setIsEditing(false);
      toast.success("Title updated");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof FrostError ? error.message : "Some error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent text-3xl font-bold text-white tracking-tight border-b border-cyan-500 focus:outline-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-cyan-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setTitle(initialTitle);
          }}
          className="text-slate-400 hover:text-white text-sm"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 group">
      <h1 className="text-3xl font-bold text-white tracking-tight">{initialTitle}</h1>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-cyan-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 1 22l1.5-6.5L17 3z"></path></svg>
      </button>
    </div>
  );
};

export const ContactsActions = ({ campaignId }: { campaignId: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Simple inline form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !company) return;

    setIsSubmitting(true);
    try {
      await addContactToCampaign(campaignId, { email, name, companyName: company });
      setIsOpen(false);
      setEmail("");
      setName("");
      setCompany("");
      toast.success("Contact added");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof FrostError ? error.message : "Failed to add contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
      >
        <Plus size={14} />
        Add Contact
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-xl p-4 z-50">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h3 className="text-white text-sm font-semibold mb-1">New Contact</h3>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            <input
              type="email"
              placeholder="Email *"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            <input
              type="text"
              placeholder="Company *"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export const RemoveContactButton = ({ contactId }: { contactId: string }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    setIsDeleting(true);
    try {
      await removeContactFromCampaign(contactId);
      toast.success("Contact removed");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof FrostError ? error.message : "Failed to delete contact");
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}

export const AddTemplateDropdown = ({ campaignId, allTemplates }: { campaignId: string, allTemplates: Template[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = async (templateId: string) => {
    setIsSubmitting(true);
    try {
      await addTemplateToCampaign(campaignId, templateId);
      setIsOpen(false);
      toast.success("Step added");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof FrostError ? error.message : "Failed to add template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
      >
        <Plus size={14} />
        Add Step
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
          <div className="p-2 border-b border-white/10">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsCreateModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              <FilePlus size={16} />
              Create new template
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {allTemplates.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">No existing templates</div>
            ) : (
              allTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t.id)}
                  disabled={isSubmitting}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors truncate"
                >
                  {t.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">New Template</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Trash2 size={24} className="rotate-45" />
              </button>
            </div>

            <TemplateForm
              onSuccess={async (template) => {
                setIsCreateModalOpen(false);
                await handleSelect(template.id);
              }}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
