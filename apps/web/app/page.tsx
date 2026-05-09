'use client';

import { useRouter } from 'next/navigation';

import AnimatedSplash from '@/components/AnimatedSplash';

export default function RootEntryPage() {
  const router = useRouter();

  return <AnimatedSplash onFinish={() => router.push('/home')} />;
}
