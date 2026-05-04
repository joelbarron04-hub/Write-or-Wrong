/*
  # Fix comments table RLS policies

  1. Security Changes
    - Drop the `Anyone can create comments` INSERT policy that uses `WITH CHECK (true)`, which bypasses RLS
    - Drop the `Anyone can view comments` SELECT policy that uses `USING (true)`, which bypasses RLS
    - Replace with restrictive policies:
      - SELECT: Anyone can view comments only when the associated post exists in the posts table
      - INSERT: Anyone can create comments only when the associated post exists in the posts table
    - This prevents inserting comments for non-existent or deleted posts
    - This prevents viewing orphaned comments whose parent post has been removed
*/

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;

-- SELECT: only allow viewing comments tied to an existing published post
CREATE POLICY "Comments visible for existing posts"
  ON comments FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = comments.post_id
    )
  );

-- INSERT: only allow creating comments tied to an existing published post
CREATE POLICY "Comments can be created for existing posts"
  ON comments FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = comments.post_id
    )
  );
