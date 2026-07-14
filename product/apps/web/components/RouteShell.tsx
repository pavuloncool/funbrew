'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';

import WebAccountRoleGate from './WebAccountRoleGate';
import WebShell from './WebShell';

export default function RouteShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <WebAccountRoleGate>
        <WebShell>{children}</WebShell>
      </WebAccountRoleGate>
    </Suspense>
  );
}
