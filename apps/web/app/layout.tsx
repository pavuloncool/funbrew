import type { ReactNode } from 'react';
import { AppOpenGate } from '../components/AppOpenGate';
import WebShell from '../components/WebShell';
import './globals.css';
import Providers from './providers';

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppOpenGate>
            <WebShell>{props.children}</WebShell>
          </AppOpenGate>
        </Providers>
      </body>
    </html>
  );
}
