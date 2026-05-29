
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars read own or self" ON storage.objects FOR SELECT USING (
  bucket_id = 'avatars'
);
