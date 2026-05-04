/*
  # Enhance Categories Table

  1. Changes
    - Add `order` column to categories for reordering on public site
    - Add `description` column for category headers/descriptions
    
  2. Security
    - Admin-only update/delete policies added
    - Public read access maintained
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'order'
  ) THEN
    ALTER TABLE categories ADD COLUMN "order" integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'description'
  ) THEN
    ALTER TABLE categories ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

CREATE POLICY "Admin can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin')
  WITH CHECK ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin');

CREATE POLICY "Admin can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin');

CREATE POLICY "Admin can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK ((select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin');
