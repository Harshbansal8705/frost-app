'use client';

import { useRouter } from 'next/navigation';
import { TemplateForm } from './TemplateForm';
import { Template } from '@/types';

export function EditTemplateWrapper({ template }: { template: Template }) {
  const router = useRouter();

  return (
    <TemplateForm
      templateId={template.id}
      initialData={{
        name: template.name,
        subject: template.subject,
        body: template.body,
        attachments: template.attachments,
      }}
      onSuccess={() => {
        router.push("/dashboard/templates");
        router.refresh();
      }}
      onCancel={() => router.back()}
    />
  );
}
