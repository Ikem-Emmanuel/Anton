import { redirect } from 'next/navigation';

// Root `/` — redirect to Mission Control as the canonical default.
export default function Page() {
  redirect('/mc');
}
