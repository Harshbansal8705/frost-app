import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth-helper";
import { EditTemplateWrapper } from "@/components/templates/EditTemplateWrapper";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await authenticateUser();
  const { id } = await params;

  const template = await prisma.template.findUnique({
    where: { id, userId: session.user.id },
  });

  if (!template) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard/templates" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4">
          <ArrowLeft size={16} />
          Back to Templates
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Template</h1>
      </div>

      <div className="bg-slate-950/50 border border-white/10 rounded-xl p-8">
        <EditTemplateWrapper template={{
          ...template,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString(),
        }} />
      </div>
    </div>
  );
}
