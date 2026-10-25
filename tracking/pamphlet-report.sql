-- Run only through the owner's authenticated database tools. No public reporting endpoint.
-- Browser counts are not verified people; app_click is not an installation.
WITH events AS (
  SELECT * FROM public.pamphlet_events
  WHERE NOT is_test
    AND received_at >= '2026-10-25T00:00:00+05:30'::timestamptz
    AND received_at < now()
), activity AS (
  SELECT campaign, placement,
    count(DISTINCT visit_id) FILTER (WHERE event_name='page_view') AS unique_browsers,
    count(*) FILTER (WHERE event_name='page_view') AS page_views,
    count(*) FILTER (WHERE event_name='demo_click') AS demo_link_clicks,
    count(*) FILTER (WHERE event_name='demo_open') AS demo_page_opens,
    count(*) FILTER (WHERE event_name='app_click') AS app_store_clicks,
    count(*) FILTER (WHERE event_name='admission_created') AS admission_forms_created
  FROM events GROUP BY campaign,placement
), sales AS (
  SELECT e.campaign,e.placement,count(DISTINCT a.admission_id) AS captured_purchases,
    sum(coalesce(a.final_amount,a.amount,0)) AS captured_revenue_inr
  FROM events e JOIN public.admissions a ON a.admission_id=e.admission_id
  WHERE e.event_name='admission_created'
    AND upper(coalesce(a.payment_mode,''))='LIVE'
    AND upper(coalesce(a.razorpay_status,''))='CAPTURED'
    AND upper(coalesce(a.status,'')) IN ('VERIFIED','GROUP_LINK_SENT')
  GROUP BY e.campaign,e.placement
)
SELECT activity.*,coalesce(sales.captured_purchases,0) AS captured_purchases,
  coalesce(sales.captured_revenue_inr,0) AS captured_revenue_inr
FROM activity LEFT JOIN sales USING(campaign,placement)
ORDER BY campaign,placement;
