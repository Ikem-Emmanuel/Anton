import { notFound } from 'next/navigation';
import { MemoryDetail } from '@/components/modules/memory-detail';
import { MEMORIES } from '@/lib/data';

export function generateStaticParams() {
  return MEMORIES.map((_, i) => ({ id: String(i) }));
}

export const dynamicParams = false;

export default async function MemoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memoryId = Number.parseInt(id, 10);
  if (Number.isNaN(memoryId) || memoryId < 0 || memoryId >= MEMORIES.length) notFound();
  return <MemoryDetail memoryId={memoryId} />;
}
