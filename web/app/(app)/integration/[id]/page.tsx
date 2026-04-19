import { notFound } from 'next/navigation';
import { IntegrationDetail } from '@/components/modules/integration-detail';
import { INTEGRATIONS } from '@/lib/data';

export function generateStaticParams() {
  return INTEGRATIONS.map((i) => ({ id: i.id }));
}

export const dynamicParams = false;

export default async function IntegrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!INTEGRATIONS.some((i) => i.id === id)) notFound();
  return <IntegrationDetail id={id} />;
}
