
export default function TemplatesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-5 w-64" />
        </div>
        <div className="skeleton h-10 w-40 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-64 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="skeleton h-6 w-3/4" />
                <div className="skeleton h-8 w-8 rounded-full" />
              </div>
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-center">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
