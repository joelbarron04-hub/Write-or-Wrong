/*
  # Ensure Draft Visibility Policies
  
  1. Security Updates
    - Ensure anonymous users cannot access drafts at all
    - Ensure drafts are only accessible to authenticated admins
    - Keep posts publicly visible
*/

DROP POLICY IF EXISTS "Admin can read drafts" ON drafts;
DROP POLICY IF EXISTS "Admin can create drafts" ON drafts;
DROP POLICY IF EXISTS "Admin can update drafts" ON drafts;
DROP POLICY IF EXISTS "Admin can delete drafts" ON drafts;

CREATE POLICY "Admin can read drafts"
  ON drafts FOR SELECT
  TO authenticated
  USING ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin');

CREATE POLICY "Admin can create drafts"
  ON drafts FOR INSERT
  TO authenticated
  WITH CHECK ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin');

CREATE POLICY "Admin can update drafts"
  ON drafts FOR UPDATE
  TO authenticated
  USING ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin')
  WITH CHECK ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin');

CREATE POLICY "Admin can delete drafts"
  ON drafts FOR DELETE
  TO authenticated
  USING ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin');
