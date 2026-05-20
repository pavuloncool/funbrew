import { redirect } from 'next/navigation';

export default function LegacyNewCoffeeRedirectPage() {
  redirect('/roaster-hub/batches/new');
}
