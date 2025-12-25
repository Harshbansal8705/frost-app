import { ArrowLeft } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8 pb-20 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm w-fit">
          <ArrowLeft size={16} className="text-slate-700" />
          <div className="h-4 w-32 bg-slate-800 rounded"></div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-64 bg-slate-800 rounded mb-2"></div>
            <div className="h-4 w-32 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 rounded-xl border border-white/5 bg-slate-900/50 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="h-4 w-24 bg-slate-800 rounded"></div>
              <div className="h-8 w-16 bg-slate-800 rounded"></div>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg h-10 w-10"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Contacts */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-7 w-32 bg-slate-800 rounded"></div>
            <div className="h-10 w-32 bg-slate-800 rounded"></div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden min-h-[400px]">
            <div className="border-b border-white/10 bg-white/5 p-4 flex gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-slate-800 rounded w-1/4"></div>
              ))}
            </div>
            <div className="p-4 flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-12 w-1/4 bg-slate-800 rounded"></div>
                  <div className="h-12 w-1/4 bg-slate-800 rounded"></div>
                  <div className="h-12 w-1/4 bg-slate-800 rounded"></div>
                  <div className="h-12 w-1/4 bg-slate-800 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Templates */}
        <div className="flex flex-col gap-4">
          <div className="h-full min-h-[400px] rounded-xl border border-white/10 bg-slate-900/50 p-6">
            <div className="h-6 w-32 bg-slate-800 rounded mb-6"></div>
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
