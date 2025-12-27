"use client";

import { useState } from "react";
import { updateProfile, updateEmailSettings, updatePreferences } from "@/app/dashboard/settings/actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Info, ChevronRight } from "lucide-react";
import { FrostError, SettingsData } from "@/types";
import { Button } from "@/components/ui/Button";

// Simple UI components to avoid dependency on missing UI library
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${className}`}>{children}</div>
);

const Label = ({ children, htmlFor, className = "" }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-slate-400 mb-1.5 ${className}`}>
    {children}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
  />
);

const Switch = ({ checked, onChange, id }: { checked: boolean; onChange: (checked: boolean) => void; id?: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    id={id}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-slate-900 ${checked ? "bg-blue-600" : "bg-slate-700"
      }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"
        }`}
    />
  </button>
);

const Tooltip = ({ content }: { content: string }) => (
  <div className="group relative inline-flex ml-2">
    <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 hidden group-hover:block z-50">
      <div className="bg-slate-800 text-slate-200 text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-700 text-center">
        {content}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45 transform"></div>
      </div>
    </div>
  </div>
);

const HelperText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-slate-500 mt-1">{children}</p>
);

export function SettingsForm({ initialData }: { initialData: SettingsData }) {
  const [activeTab, setActiveTab] = useState<"profile" | "email" | "preferences">("profile");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const session = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState({
    name: initialData.name || "",
  });

  const [emailSettings, setEmailSettings] = useState<{
    fromName: string;
    fromEmail: string;
    smtpHost: string;
    smtpPort: number | string;
    smtpUser: string;
    smtpPassword?: string;
    imapHost: string;
    imapPort: number | string;
    imapUser: string;
    imapPassword?: string;
  }>({
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

  const [preferences, setPreferences] = useState({
    stopAllCompanyMailsOnReply: initialData.preferences?.stopAllCompanyMailsOnReply ?? true,
    timezone: initialData.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    mailSendingTime: initialData.preferences?.mailSendingTime || "09:00",
    sendOnWeekends: initialData.preferences?.sendOnWeekends ?? false,
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
      toast.error(error instanceof FrostError ? error.message : "Failed to update profile");
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
      toast.error(error instanceof FrostError ? error.message : "Failed to save email settings");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updatePreferences(preferences);
      router.refresh();
      toast.success("Preferences updated successfully");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof FrostError ? error.message : "Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-xl mb-8 w-fit">
        {["profile", "email", "preferences"].map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab as "profile" | "email" | "preferences")}
            variant={activeTab === tab ? "primary" : "ghost"}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
              ? "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {activeTab === "profile" && (
        <Card className="p-4 md:p-6">
          <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
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
        <Card className="p-4 md:p-6">
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
                  <Label htmlFor="smtpUser">Username</Label>
                  <Input
                    id="smtpUser"
                    placeholder="user@example.com"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                    required
                  />
                  <HelperText>
                    Your email address (e.g. user@gmail.com). <br />
                    <span className="text-amber-500/80">Note: For Gmail SMTP, this must be the same as your email address.</span>
                  </HelperText>
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
            <div className="space-y-4 border-b border-slate-800 pb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">IMAP Settings (Receiving)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Advanced Settings Checkbox */}
            <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors w-full"
              >
                <ChevronRight className={`w-4 h-4 text-blue-500 transition-transform duration-200 ${showAdvanced ? "rotate-90" : ""}`} />
                Show Advanced Server Settings
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="md:col-span-1">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtp.example.com"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      placeholder="587"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="imapHost">IMAP Host</Label>
                    <Input
                      id="imapHost"
                      placeholder="imap.example.com"
                      value={emailSettings.imapHost}
                      onChange={(e) => setEmailSettings({ ...emailSettings, imapHost: e.target.value })}
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="imapPort">IMAP Port</Label>
                    <Input
                      id="imapPort"
                      type="number"
                      placeholder="993"
                      value={emailSettings.imapPort}
                      onChange={(e) => setEmailSettings({ ...emailSettings, imapPort: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" isLoading={loading} className="w-full">
              Save
            </Button>
          </form>
        </Card>
      )}

      {activeTab === "preferences" && (
        <Card className="p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">General Preferences</h2>
            <p className="text-slate-400 text-sm mt-1">
              Customize how Frost behaves and sends emails.
            </p>
          </div>

          <form onSubmit={handlePreferencesSubmit} className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/20">
              <div className="space-y-0.5">
                <Label htmlFor="stopAllCompanyMailsOnReply" className="mb-0! text-slate-200 flex items-center">
                  Stop all company mails on reply
                  <Tooltip content="If enabled, receiving a reply from any contact in a company will automatically stop emails for all other contacts in that same company." />
                </Label>
                <HelperText>Pauses campaign for all company contacts when one replies.</HelperText>
              </div>
              <Switch
                id="stopAllCompanyMailsOnReply"
                checked={preferences.stopAllCompanyMailsOnReply}
                onChange={(checked) => setPreferences({ ...preferences, stopAllCompanyMailsOnReply: checked })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                >
                  {Intl.supportedValuesOf("timeZone").map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                <HelperText>Your local timezone for scheduling.</HelperText>
              </div>

              <div>
                <Label htmlFor="mailSendingTime">Mail Sending Time</Label>
                <Input
                  id="mailSendingTime"
                  type="time"
                  value={preferences.mailSendingTime}
                  onChange={(e) => setPreferences({ ...preferences, mailSendingTime: e.target.value })}
                />
                <HelperText>Start sending emails after this time.</HelperText>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/20">
              <div className="space-y-0.5">
                <Label htmlFor="sendOnWeekends" className="mb-0 text-slate-200">Send on Weekends</Label>
                <HelperText>Allow emails to be sent on Saturdays and Sundays.</HelperText>
              </div>
              <Switch
                id="sendOnWeekends"
                checked={preferences.sendOnWeekends}
                onChange={(checked) => setPreferences({ ...preferences, sendOnWeekends: checked })}
              />
            </div>

            <p className="text-xs text-amber-500/80 mt-1">
              Note: Changes don&apos;t apply to already scheduled emails.
            </p>

            <div className="pt-2">
              <Button type="submit" isLoading={loading}>
                Save Preferences
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
