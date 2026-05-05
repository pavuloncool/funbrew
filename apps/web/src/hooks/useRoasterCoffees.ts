'use client';

import { useQuery } from '@tanstack/react-query';

import {
  getBrowserSessionSafely,
  getBrowserUserSafely,
} from '@/src/lib/supabase/browserAuth';

export type RoasterCoffee = {
  id: string;
  name: string;
  status: string;
};

async function fetchRoasterCoffees(): Promise<RoasterCoffee[]> {
  const user = await getBrowserUserSafely();
  if (!user) {
    throw new Error('AUTH_REQUIRED');
  }

  const session = await getBrowserSessionSafely();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!session?.access_token || !supabaseUrl || !anonKey) {
    throw new Error('Missing auth session or Supabase env.');
  }

  const roasterResponse = await fetch(
    `${supabaseUrl}/rest/v1/roasters?select=id&user_id=eq.${user.id}&limit=1`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );
  const roasterRows = (await roasterResponse.json()) as Array<{ id: string }>;
  const roasterId = roasterRows[0]?.id;
  if (!roasterId) {
    throw new Error('No roaster profile linked to this account.');
  }

  const listResponse = await fetch(
    `${supabaseUrl}/rest/v1/coffees?select=id,name,status&roaster_id=eq.${roasterId}&order=created_at.desc`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );
  if (!listResponse.ok) {
    throw new Error('Failed to load coffees list.');
  }

  return ((await listResponse.json()) as RoasterCoffee[]) ?? [];
}

export function useRoasterCoffees() {
  return useQuery({
    queryKey: ['roaster-coffees'],
    queryFn: fetchRoasterCoffees,
  });
}
