export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="skeleton h-5 w-32"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="skeleton h-10 w-64"></div>
            <div className="skeleton h-4 w-40 mt-2"></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24 border border-white/5"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Contacts */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="skeleton h-7 w-24"></div>
            <div className="skeleton h-8 w-32"></div>
          </div>
          <div className="skeleton border border-white/5 h-[400px]"></div>
        </div>

        {/* Right Column: Templates */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="skeleton h-7 w-24"></div>
            <div className="skeleton h-8 w-24"></div>
          </div>
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-24 border border-white/5"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
