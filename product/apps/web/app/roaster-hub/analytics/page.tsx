import { redirect } from 'next/navigation';

export default function LegacyAnalyticsHubRedirectPage() {
  redirect('/roaster-hub/batches');
}
