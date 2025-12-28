"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TemplateForm } from "@/components/templates/TemplateForm";

export default function NewTemplatePage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard/templates" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4">
          <ArrowLeft size={16} />
          Back to Templates
        </Link>
        <h1 className="text-2xl font-bold text-white">Create New Template</h1>
      </div>

      <div className="bg-slate-950/50 border border-white/10 rounded-xl p-8">
        <TemplateForm
          onSuccess={() => {
            router.push("/dashboard/templates");
          }}
        />
      </div>
    </div>
  );
}
