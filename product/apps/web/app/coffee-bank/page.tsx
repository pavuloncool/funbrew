import { redirect } from 'next/navigation';

export default function CoffeeBankRedirectPage() {
  redirect('/roaster-hub/batches');
}
