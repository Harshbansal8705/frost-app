'use client';

import { useState } from "react";
import { Plus, Trash2, FilePlus } from "lucide-react";
import { addContactToCampaign, removeContactFromCampaign, addTemplateToCampaign, updateCampaign } from "@/app/dashboard/campaigns/actions";
import { FrostError, Template } from "@/types";
import { toast } from "sonner";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { Button } from "@/components/ui/Button";

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
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="px-3 py-1 text-sm"
        >
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setIsEditing(false);
            setTitle(initialTitle);
          }}
          className="text-slate-400 hover:text-white text-sm h-8"
        >
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 group">
      <h1 className="text-3xl font-bold text-white tracking-tight">{initialTitle}</h1>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-cyan-400 h-8 w-8 hover:bg-transparent"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 1 22l1.5-6.5L17 3z"></path></svg>
      </Button>
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
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 px-3 py-1.5 text-xs font-semibold h-auto"
      >
        <Plus size={14} />
        Add Contact
      </Button>

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
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white h-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="flex-1 px-3 py-1.5 text-xs font-semibold h-auto"
              >
                Add
              </Button>
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
    <Button
      onClick={handleDelete}
      variant="destructive"
      size="icon"
      isLoading={isDeleting}
      className="h-8 w-8 hover:bg-red-400/10 text-slate-500 hover:text-red-400"
    >
      {!isDeleting && <Trash2 size={16} />}
    </Button>
  );
}

export const AddTemplateDropdown = ({
  campaignId,
  allTemplates,
  onAdd
}: {
  campaignId: string,
  allTemplates: Template[],
  onAdd?: (templateId: string) => Promise<void>
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = async (templateId: string) => {
    setIsSubmitting(true);
    try {
      if (onAdd) {
        await onAdd(templateId);
      } else {
        await addTemplateToCampaign(campaignId, templateId);
        toast.success("Step added");
      }
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof FrostError ? error.message : "Failed to add template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 px-3 py-1.5 text-xs font-semibold h-auto"
      >
        <Plus size={14} />
        Add Step
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
          <div className="p-2 border-b border-white/10">
            <Button
              variant="ghost"
              onClick={() => {
                setIsOpen(false);
                setIsCreateModalOpen(true);
              }}
              className="w-full justify-start gap-2 px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg h-auto"
            >
              <FilePlus size={16} />
              Create new template
            </Button>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {allTemplates.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">No existing templates</div>
            ) : (
              allTemplates.map(t => (
                <Button
                  key={t.id}
                  variant="ghost"
                  onClick={() => handleSelect(t.id)}
                  isLoading={isSubmitting}
                  className="w-full justify-start px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg h-auto"
                >
                  <span className="truncate">{t.name}</span>
                </Button>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-transparent h-auto w-auto p-1"
              >
                <Trash2 size={24} className="rotate-45" />
              </Button>
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
