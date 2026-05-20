'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import WebAccountRoleGate from './WebAccountRoleGate';
import WebShell from './WebShell';

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/') {
    return <>{children}</>;
  }

  return (
    <WebAccountRoleGate>
      <WebShell>{children}</WebShell>
    </WebAccountRoleGate>
  );
}
