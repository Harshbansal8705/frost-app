
export default function SettingsLoading() {
  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <div className="skeleton h-9 w-32 mb-2" />
        <div className="skeleton h-5 w-96" />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-xl mb-8 w-fit">
          <div className="skeleton h-9 w-20 rounded-lg" />
          <div className="skeleton h-9 w-20 rounded-lg" />
        </div>

        {/* Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6">
          <div className="skeleton h-7 w-40 mb-6" /> {/* Section Title */}

          <div className="space-y-6 max-w-md">
            <div>
              <div className="skeleton h-5 w-24 mb-2" /> {/* Label */}
              <div className="skeleton h-10 w-full rounded-lg" /> {/* Input */}
            </div>

            <div>
              <div className="skeleton h-5 w-16 mb-2" /> {/* Label */}
              <div className="skeleton h-10 w-full rounded-lg" /> {/* Input */}
              <div className="skeleton h-4 w-40 mt-1" /> {/* Helper text */}
            </div>

            <div className="skeleton h-10 w-32 rounded-lg mt-4" /> {/* Button */}
          </div>
        </div>
      </div>
    </div>
  );
}
