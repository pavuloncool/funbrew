BEGIN;

CREATE TABLE IF NOT EXISTS public.user_favorite_qr_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  qr_hash text NOT NULL REFERENCES public.qr_codes(hash) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.roast_batches(id) ON DELETE CASCADE,
  coffee_id uuid NOT NULL REFERENCES public.coffees(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, qr_hash)
);

CREATE INDEX IF NOT EXISTS user_favorite_qr_entries_user_created_idx
  ON public.user_favorite_qr_entries(user_id, created_at DESC);

ALTER TABLE public.user_favorite_qr_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own favorite qr entries" ON public.user_favorite_qr_entries;
CREATE POLICY "Users can read own favorite qr entries"
  ON public.user_favorite_qr_entries
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorite qr entries" ON public.user_favorite_qr_entries;
CREATE POLICY "Users can insert own favorite qr entries"
  ON public.user_favorite_qr_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorite qr entries" ON public.user_favorite_qr_entries;
CREATE POLICY "Users can delete own favorite qr entries"
  ON public.user_favorite_qr_entries
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_batch_community_reviews(p_batch_id uuid)
RETURNS TABLE (
  review_id uuid,
  body text,
  coffee_log_id uuid,
  logged_at timestamptz,
  helpful_count bigint,
  viewer_marked_helpful boolean,
  author_name text,
  author_sensory_level public.sensory_level
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id AS review_id,
    r.body,
    cl.id AS coffee_log_id,
    cl.logged_at,
    COALESCE(votes.helpful_count, 0) AS helpful_count,
    COALESCE(viewer.viewer_marked_helpful, false) AS viewer_marked_helpful,
    u.display_name AS author_name,
    u.sensory_level AS author_sensory_level
  FROM public.reviews r
  INNER JOIN public.coffee_logs cl
    ON cl.id = r.coffee_log_id
  INNER JOIN public.users u
    ON u.id = cl.user_id
  LEFT JOIN (
    SELECT rv.review_id, COUNT(*)::bigint AS helpful_count
    FROM public.review_votes rv
    WHERE rv.vote = true
    GROUP BY rv.review_id
  ) votes
    ON votes.review_id = r.id
  LEFT JOIN (
    SELECT rv.review_id, true AS viewer_marked_helpful
    FROM public.review_votes rv
    WHERE rv.user_id = auth.uid()
      AND rv.vote = true
  ) viewer
    ON viewer.review_id = r.id
  WHERE cl.batch_id = p_batch_id
  ORDER BY COALESCE(votes.helpful_count, 0) DESC, cl.logged_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_batch_community_reviews(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_community_summary(p_user_id uuid)
RETURNS TABLE (
  review_count bigint,
  helpful_received bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(DISTINCT r.id)::bigint AS review_count,
    COUNT(rv.*) FILTER (WHERE rv.vote = true)::bigint AS helpful_received
  FROM public.coffee_logs cl
  LEFT JOIN public.reviews r
    ON r.coffee_log_id = cl.id
  LEFT JOIN public.review_votes rv
    ON rv.review_id = r.id
  WHERE cl.user_id = p_user_id
    AND auth.uid() = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_community_summary(uuid) TO authenticated;

COMMIT;
