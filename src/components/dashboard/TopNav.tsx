"use client";

import { User } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

export function TopNav() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl px-6 transition-all">
      <div className="flex flex-1 justify-end items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{session?.user?.name || session?.user?.email || "User"}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
            {session?.user?.image ? (
              <div className="relative h-full w-full">
                <Image
                  src={session.user.image}
                  alt="Profile"
                  fill
                  className="rounded-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <User size={16} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
