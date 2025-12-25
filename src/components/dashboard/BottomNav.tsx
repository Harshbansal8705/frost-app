"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  FileText,
  Settings,
} from "lucide-react";
import clsx from "clsx";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Send },
  { name: "Templates", href: "/dashboard/templates", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-white/10 bg-slate-950/80 backdrop-blur-xl px-2 pb-4 md:hidden">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "flex flex-col items-center gap-1 rounded-xl p-2 transition-all duration-200",
              isActive
                ? "text-cyan-400"
                : "text-slate-500 hover:text-white"
            )}
          >
            <div
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                isActive ? "bg-cyan-500/10" : ""
              )}
            >
              <item.icon size={20} className="fill-current/10" />
            </div>
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
