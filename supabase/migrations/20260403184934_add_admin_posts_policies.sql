/*
  # Update Posts Policies for Admin Management
  
  1. New Policies
    - Admin can create, update, and delete posts
    - Public can read published posts
    - Anonymous commenting remains enabled
*/

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON posts;

-- Create new admin-aware policies
CREATE POLICY "Anyone can view published posts"
  ON posts FOR SELECT
  TO anon, authenticated
  USING (published_at <= now());

CREATE POLICY "Admin can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin');

CREATE POLICY "Admin can update posts"
  ON posts FOR UPDATE
  TO authenticated
  USING ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin')
  WITH CHECK ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin');

CREATE POLICY "Admin can delete posts"
  ON posts FOR DELETE
  TO authenticated
  USING ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin');