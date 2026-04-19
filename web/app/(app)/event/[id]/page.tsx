import { notFound } from 'next/navigation';
import { EventDetail } from '@/components/modules/event-detail';
import { ACTIVITY } from '@/lib/data';

export function generateStaticParams() {
  return ACTIVITY.map((_, i) => ({ id: String(i) }));
}

export const dynamicParams = false;

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = Number.parseInt(id, 10);
  if (Number.isNaN(eventId) || eventId < 0 || eventId >= ACTIVITY.length) notFound();
  return <EventDetail eventId={eventId} />;
}
