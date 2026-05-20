import Link from 'next/link';

import { authPagesStyles } from '../auth-pages.styles';

export default function PendingPage() {
  return (
    <main className={authPagesStyles.main620}>
      <h1 className={authPagesStyles.title}>Account pending</h1>
      <p className="text-sm leading-relaxed text-vs-text-secondary">
        If your project requires email verification, check your inbox and confirm the
        account. Then return to login.
      </p>
      <p className={authPagesStyles.footer}>
        <Link href="/login" className="font-medium text-vs-text-primary underline">
          Go to login
        </Link>
      </p>
    </main>
  );
}
