import { SettingsForm } from "@/components/settings/SettingsForm";
import { getSettings } from "./actions";

export const metadata = {
  title: "Settings | Frost",
  description: "Manage your profile and email configuration",
};

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-cyan-300">
          Settings
        </h1>
        <p className="text-slate-400 mt-2">
          Manage your account profile and email configuration preferences.
        </p>
      </div>

      <SettingsForm initialData={settings} />
    </div>
  );
}
