import type { ReactNode } from 'react';

import WebFooter from './WebFooter';
import WebHeader from './WebHeader';

export default function WebShell(props: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-vs-canvas">
      <WebHeader />
      <main className="flex-1">{props.children}</main>
      <WebFooter />
    </div>
  );
}
