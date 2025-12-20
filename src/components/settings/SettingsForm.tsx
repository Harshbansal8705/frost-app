"use client";

import { useState } from "react";
import { updateProfile, updateEmailSettings } from "@/app/dashboard/settings/actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// Simple UI components to avoid dependency on missing UI library
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${className}`}>{children}</div>
);

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-400 mb-1.5">
    {children}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
  />
);

const Button = ({ children, isLoading, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) => (
  <button
    {...props}
    disabled={isLoading || props.disabled}
    className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
    {isLoading && (
      <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    )}
    {children}
  </button>
);

const HelperText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-slate-500 mt-1">{children}</p>
);

export function SettingsForm({ initialData }: { initialData: any }) {
  const [activeTab, setActiveTab] = useState<"profile" | "email">("profile");
  const [loading, setLoading] = useState(false);
  const session = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState({
    name: initialData.name || "",
  });

  const [emailSettings, setEmailSettings] = useState({
    fromName: initialData.emailSettings?.fromName || session.data?.user?.name || "",
    fromEmail: initialData.emailSettings?.fromEmail || session.data?.user?.email || "",
    smtpHost: initialData.emailSettings?.smtpHost || "smtp.gmail.com",
    smtpPort: initialData.emailSettings?.smtpPort || 587,
    smtpUser: initialData.emailSettings?.smtpUser || session.data?.user?.email || "",
    smtpPassword: "",
    imapHost: initialData.emailSettings?.imapHost || "imap.gmail.com",
    imapPort: initialData.emailSettings?.imapPort || 993,
    imapUser: initialData.emailSettings?.imapUser || session.data?.user?.email || "",
    imapPassword: "",
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(profile);
      router.refresh();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateEmailSettings({
        ...emailSettings,
        smtpPort: Number(emailSettings.smtpPort),
        imapPort: Number(emailSettings.imapPort),
      });
      router.refresh();
      // Clear passwords from state for security after save
      setEmailSettings(prev => ({ ...prev, smtpPassword: "", imapPassword: "" }));
      toast.success("Email settings saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save email settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-xl mb-8 w-fit">
        {["profile", "email"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-md">
            <div>
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your Name"
              />
            </div>

            {/* Email is typically read-only or handled separately in NextAuth */}
            <div>
              <Label>Email</Label>
              <div className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/50 text-slate-500 text-sm">
                {initialData.email}
              </div>
              <p className="text-xs text-slate-600 mt-1">Managed by your login provider</p>
            </div>

            <Button type="submit" isLoading={loading}>
              Save Profile
            </Button>
          </form>
        </Card>
      )}

      {activeTab === "email" && (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Email Configuration</h2>
            <p className="text-slate-400 text-sm mt-1">
              Configure SMTP and IMAP settings to enable sending and receiving emails.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-8">
            {/* Sender Details */}
            <div className="space-y-4 border-b border-slate-800 pb-8">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Sender Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromName">Sender Name</Label>
                  <Input
                    id="fromName"
                    placeholder="e.g. John Doe"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  />
                  <HelperText>Name displayed to recipients</HelperText>
                </div>
                <div>
                  <Label htmlFor="fromEmail">Sender Email (From)</Label>
                  <Input
                    id="fromEmail"
                    placeholder="e.g. john@company.com"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  />
                  <HelperText>Email address you are sending from</HelperText>
                </div>
              </div>
            </div>

            {/* SMTP Settings */}
            <div className="space-y-4 border-b border-slate-800 pb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">SMTP Settings (Sending)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <Label htmlFor="smtpHost">Host</Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.example.com"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                    required
                  />
                  <HelperText>Server host (e.g. smtp.gmail.com for Gmail)</HelperText>
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    placeholder="587"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                    required
                  />
                  <HelperText>Server port (usually 587)</HelperText>
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="smtpUser">Username</Label>
                  <Input
                    id="smtpUser"
                    placeholder="user@example.com"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                    required
                  />
                  <HelperText>Your email address (e.g. user@gmail.com)</HelperText>
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="smtpPassword">Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    placeholder={initialData.emailSettings?.smtpHost ? "••••••••" : "Enter password"}
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                  />
                  <HelperText>
                    App Password (NOT login password). Generate at{" "}
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      myaccount.google.com/apppasswords
                    </a>
                  </HelperText>
                </div>
              </div>
            </div>

            {/* IMAP Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">IMAP Settings (Receiving)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <Label htmlFor="imapHost">Host</Label>
                  <Input
                    id="imapHost"
                    placeholder="imap.example.com"
                    value={emailSettings.imapHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, imapHost: e.target.value })}
                    required
                  />
                  <HelperText>Server host (e.g. imap.gmail.com for Gmail)</HelperText>
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="imapPort">Port</Label>
                  <Input
                    id="imapPort"
                    type="number"
                    placeholder="993"
                    value={emailSettings.imapPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, imapPort: e.target.value })}
                    required
                  />
                  <HelperText>Server port (usually 993)</HelperText>
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="imapUser">Username</Label>
                  <Input
                    id="imapUser"
                    placeholder="user@example.com"
                    value={emailSettings.imapUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, imapUser: e.target.value })}
                    required
                  />
                  <HelperText>Your email address</HelperText>
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="imapPassword">Password</Label>
                  <Input
                    id="imapPassword"
                    type="password"
                    placeholder={initialData.emailSettings?.imapHost ? "••••••••" : "Enter password"}
                    value={emailSettings.imapPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, imapPassword: e.target.value })}
                  />
                  <HelperText>Use same App Password as SMTP</HelperText>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <Button type="submit" isLoading={loading} className="w-full md:w-auto">
                Save Configuration
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
