import { notFound } from 'next/navigation';
import type { Route } from '@/lib/nav';
import { ROUTE_VIEWS } from '@/lib/routes';

const VALID_ROUTES = Object.keys(ROUTE_VIEWS) as Route[];

export function generateStaticParams() {
  return VALID_ROUTES.map((route) => ({ route }));
}

export const dynamicParams = false;

export default async function RoutePage({ params }: { params: Promise<{ route: string }> }) {
  const { route } = await params;
  if (!VALID_ROUTES.includes(route as Route)) notFound();
  return ROUTE_VIEWS[route as Route];
}
