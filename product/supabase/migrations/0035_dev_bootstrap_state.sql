BEGIN;

CREATE TABLE IF NOT EXISTS public.dev_bootstrap_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  profile text NOT NULL DEFAULT 'persist'
    CHECK (profile IN ('persist', 'demo-reset')),
  seed_version text,
  last_reset_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.dev_bootstrap_state (
  singleton,
  profile,
  seed_version,
  last_reset_at,
  updated_at
)
VALUES (
  true,
  'persist',
  null,
  null,
  now()
)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.dev_bootstrap_state ENABLE ROW LEVEL SECURITY;

COMMIT;
