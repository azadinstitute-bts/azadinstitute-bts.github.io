CREATE TABLE public.pamphlet_events (
  event_id uuid PRIMARY KEY,
  visit_id uuid NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  campaign text NOT NULL CHECK (campaign = 'pamphlet_2026_10'),
  placement text NOT NULL CHECK (placement IN ('general','library','college','coaching')),
  event_name text NOT NULL CHECK (event_name IN ('page_view','demo_click','demo_open','app_click','course_click','admission_created')),
  page_path text NOT NULL CHECK (length(page_path) <= 160 AND page_path ~ '^/[a-zA-Z0-9_./-]*$'),
  admission_id text,
  is_test boolean NOT NULL DEFAULT false,
  CHECK ((event_name = 'admission_created' AND admission_id ~ '^ADM_[0-9a-f]{48}$')
    OR (event_name <> 'admission_created' AND admission_id IS NULL)),
  CHECK (event_name <> 'admission_created' OR admission_id IS NOT NULL)
);
ALTER TABLE public.pamphlet_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pamphlet_events FROM PUBLIC, anon, authenticated;
GRANT INSERT (event_id,visit_id,campaign,placement,event_name,page_path,admission_id,is_test)
  ON public.pamphlet_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pamphlet_events TO service_role;
CREATE POLICY pamphlet_insert_only ON public.pamphlet_events
  FOR INSERT TO anon WITH CHECK (true);
CREATE INDEX pamphlet_events_campaign_date ON public.pamphlet_events(campaign,placement,received_at);
CREATE UNIQUE INDEX pamphlet_events_admission_once ON public.pamphlet_events(admission_id)
  WHERE admission_id IS NOT NULL;
COMMENT ON TABLE public.pamphlet_events IS
  'Optional pamphlet events; anonymous INSERT only. No public reads or edits. Verified purchases are joined to existing admissions; no payment/auth changes.';

