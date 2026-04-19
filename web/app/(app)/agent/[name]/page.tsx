import { notFound } from 'next/navigation';
import { AgentDetail } from '@/components/modules/agent-detail';
import { AGENTS } from '@/lib/data';

export function generateStaticParams() {
  return AGENTS.map((a) => ({ name: a.n }));
}

export const dynamicParams = false;

export default async function AgentDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  if (!AGENTS.some((a) => a.n === decoded)) notFound();
  return <AgentDetail name={decoded} />;
}
