'use client';

import { useState, type ReactNode } from 'react';

import AnimatedSplash from './AnimatedSplash';

/**
 * Pokazuje pierwotny AnimatedSplash tylko przy pierwszym zamontowaniu root layoutu
 * (Next.js App Router nie remountuje layoutu przy client-side navigacji — animacja nie wraca przy routingu).
 */
export function AppOpenGate({ children }: { children: ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <AnimatedSplash onFinish={() => setSplashDone(true)} />;
  }

  return <>{children}</>;
}
