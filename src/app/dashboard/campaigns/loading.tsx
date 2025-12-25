
export default function CampaignsLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="skeleton h-9 w-48 mb-2" />
          <div className="skeleton h-5 w-80" />
        </div>
        <div className="skeleton h-10 w-40 rounded-lg" />
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="skeleton h-10 w-full max-w-sm rounded-lg" />
      </div>

      {/* Campaigns List */}
      <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-white/5 border-b border-white/10 p-4 grid grid-cols-8 gap-4">
          <div className="skeleton h-6 w-20 col-span-1" /> {/* Name */}
          <div className="skeleton h-6 w-16 col-span-1" /> {/* Status */}
          <div className="skeleton h-6 w-16 col-span-1" /> {/* Contacts */}
          <div className="skeleton h-6 w-12 col-span-1" /> {/* Sent */}
          <div className="skeleton h-6 w-12 col-span-1" /> {/* Replied */}
          <div className="skeleton h-6 w-12 col-span-1" /> {/* Bounced */}
          <div className="skeleton h-6 w-20 col-span-1" /> {/* Created */}
          <div className="skeleton h-6 w-10 col-span-1 justify-self-end" /> {/* Actions */}
        </div>

        {/* Table Body - 5 rows */}
        <div className="divide-y divide-white/5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 grid grid-cols-8 gap-4 items-center">
              <div className="skeleton h-5 w-32 col-span-1" />
              <div className="skeleton h-6 w-16 rounded-full col-span-1" />
              <div className="col-span-1 flex items-center gap-2">
                <div className="skeleton h-4 w-4" />
                <div className="skeleton h-4 w-8" />
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <div className="skeleton h-4 w-4" />
                <div className="skeleton h-4 w-8" />
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <div className="skeleton h-4 w-4" />
                <div className="skeleton h-4 w-8" />
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <div className="skeleton h-4 w-4" />
                <div className="skeleton h-4 w-8" />
              </div>
              <div className="skeleton h-4 w-24 col-span-1" />
              <div className="col-span-1 justify-self-end">
                <div className="skeleton h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
