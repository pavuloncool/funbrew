BEGIN;

CREATE TABLE IF NOT EXISTS public.user_roaster_follows (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  roaster_id uuid NOT NULL REFERENCES public.roasters(id) ON DELETE CASCADE,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, roaster_id),
  CONSTRAINT user_roaster_follows_source_check
    CHECK (source IN ('legacy-backfill', 'discover-roasters-hub', 'roaster-profile', 'roasters-screen'))
);

CREATE INDEX IF NOT EXISTS user_roaster_follows_roaster_created_idx
  ON public.user_roaster_follows(roaster_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_roaster_follows_user_created_idx
  ON public.user_roaster_follows(user_id, created_at DESC);

ALTER TABLE public.user_roaster_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own roaster follows" ON public.user_roaster_follows;
CREATE POLICY "Users can read own roaster follows"
  ON public.user_roaster_follows
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own roaster follows" ON public.user_roaster_follows;
CREATE POLICY "Users can insert own roaster follows"
  ON public.user_roaster_follows
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.roasters r
      WHERE r.id = roaster_id
        AND r.verification_status = 'verified'
    )
  );

DROP POLICY IF EXISTS "Users can delete own roaster follows" ON public.user_roaster_follows;
CREATE POLICY "Users can delete own roaster follows"
  ON public.user_roaster_follows
  FOR DELETE
  USING (auth.uid() = user_id);

INSERT INTO public.user_roaster_follows (
  user_id,
  roaster_id,
  source,
  created_at,
  last_seen_at
)
SELECT
  u.id,
  followed.roaster_id,
  'legacy-backfill',
  now(),
  now()
FROM public.users u
CROSS JOIN LATERAL (
  SELECT DISTINCT roaster_id
  FROM unnest(COALESCE(u.following_roaster_ids, '{}'::uuid[])) AS roaster_id
) AS followed
INNER JOIN public.roasters r
  ON r.id = followed.roaster_id
ON CONFLICT (user_id, roaster_id) DO NOTHING;

COMMIT;
