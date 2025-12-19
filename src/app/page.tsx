import Link from "next/link";
import { ArrowRight, BarChart3, Zap, Shield, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Zap size={18} fill="currentColor" />
          </div>
          Frost
        </div>

        <div className="flex items-center gap-4">
          <Link href="/auth/signin" className="px-5 py-2 text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all backdrop-blur-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center pt-20 pb-32 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium text-cyan-400 bg-cyan-950/30 border border-cyan-900/50 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          v1.0 is now live
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl mb-6 leading-[1.1]">
          Cold outreach that <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600">
            doesn't feel cold.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Automate your email campaigns with AI-driven personalization,
          smart warmups, and unified inbox management.
          Stop landing in spam. Start booking meetings.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/dashboard" className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-linear-to-r from-cyan-500 to-blue-600 rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 group">
            Start Campaign
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>



      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-4 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything you need to scale</h2>
            <p className="text-slate-400">Frost provides the infrastructure for high-deliverability cold email.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="text-cyan-400" />,
                title: "Real-time Analytics",
                desc: "Track opens, clicks, and replies in real-time. Know exactly what's working."
              },
              {
                icon: <Shield className="text-purple-400" />,
                title: "Email Warmup",
                desc: "Automatically warm up your domains to ensure high deliverability and avoid spam folders."
              },
              {
                icon: <Globe className="text-blue-400" />,
                title: "Unified Inbox",
                desc: "Manage replies from all your email accounts in one single, streamlined interface."
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all group">
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/10 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Frost Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
