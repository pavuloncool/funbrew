import { redirect } from 'next/navigation';

export default function LegacyCreateBatchRedirectPage() {
  redirect('/roaster-hub/batches');
}
