import { EventDetail } from '@/components/modules/event-detail';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventDetail eventId={Number.parseInt(id, 10)} />;
}
