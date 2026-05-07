import { redirect } from 'next/navigation';

export default function LegacyBatchCreateRedirectPage() {
  redirect('/roaster-hub/coffees/new');
}
