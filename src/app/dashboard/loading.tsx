export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 pb-20 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="h-5 w-32 bg-slate-800 rounded"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-10 w-64 bg-slate-800 rounded"></div>
            <div className="h-4 w-40 bg-slate-800 rounded mt-2"></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-800/50 rounded-xl border border-white/5"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Contacts */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-7 w-24 bg-slate-800 rounded"></div>
            <div className="h-8 w-32 bg-slate-800 rounded"></div>
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-xl h-[400px]"></div>
        </div>

        {/* Right Column: Templates */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-7 w-24 bg-slate-800 rounded"></div>
            <div className="h-8 w-24 bg-slate-800 rounded"></div>
          </div>
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800/50 rounded-xl border border-white/5"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
