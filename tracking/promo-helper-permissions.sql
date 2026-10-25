GRANT EXECUTE ON FUNCTION public.increment_admission_promo_usage(text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_admission_promo_usage(text) FROM PUBLIC, anon, authenticated;
