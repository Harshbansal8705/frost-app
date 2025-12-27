import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { authenticateUser } from "@/lib/auth-helper";
import CredentialsWarning from "@/components/dashboard/CredentialsWarning";

export const metadata: Metadata = {
  title: "Dashboard | Frost",
  description: "Manage your cold email campaigns",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await authenticateUser();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" />
      </div>

      <Sidebar />
      <BottomNav />
      <div className="md:pl-64 flex flex-col min-h-screen relative z-10 pb-20 md:pb-0">
        <TopNav />
        <CredentialsWarning />
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
