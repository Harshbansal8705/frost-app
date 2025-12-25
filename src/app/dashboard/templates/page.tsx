import { TemplateList } from "@/components/templates/TemplateList";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth-helper";

export default async function TemplatesPage() {
  const session = await authenticateUser();

  const templates = await prisma.template.findMany({
    where: { user: { id: session.user.id } },
    orderBy: { createdAt: "desc" },
  });

  // Map to match Template interface (createdAt string)
  const mappedTemplates = templates.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt ? t.updatedAt.toISOString() : undefined,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TemplateList templates={mappedTemplates} />
    </div>
  );
}
