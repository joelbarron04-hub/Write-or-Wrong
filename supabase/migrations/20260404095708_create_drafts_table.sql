/*
  # Create Drafts (WIP) Table

  1. New Table
    - `drafts`
      - `id` (uuid, primary key)
      - `title` (text) - Draft title
      - `slug` (text) - URL-friendly version
      - `excerpt` (text) - Short description
      - `content` (text) - Full draft content with rich text formatting
      - `category_id` (uuid, foreign key) - Links to categories
      - `author` (text) - Author name
      - `is_featured` (boolean) - Whether to show on homepage once published
      - `status` (text) - Draft status ('draft' or 'published')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on drafts table
    - Admin-only access (can create, read, update, delete)
    - Drafts are never visible to public or authenticated non-admins
*/

CREATE TABLE IF NOT EXISTS drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author text NOT NULL DEFAULT 'Anonymous',
  is_featured boolean DEFAULT false,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drafts_category_id ON drafts(category_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_updated_at ON drafts(updated_at DESC);

ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

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
