/*
  # Write or Wrong - Initial Schema
  
  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Category name
      - `slug` (text, unique) - URL-friendly version
      - `created_at` (timestamptz)
    
    - `posts`
      - `id` (uuid, primary key)
      - `title` (text) - Post title
      - `slug` (text, unique) - URL-friendly version
      - `excerpt` (text) - Short description
      - `content` (text) - Full post content
      - `category_id` (uuid, foreign key) - Links to categories
      - `author` (text) - Author name
      - `is_featured` (boolean) - Whether to show on homepage
      - `published_at` (timestamptz) - Publication date
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key) - Links to posts
      - `author_name` (text) - Commenter name
      - `author_email` (text) - Commenter email
      - `content` (text) - Comment text
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Public read access for categories and posts
    - Public read and insert for comments (anonymous commenting)
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL,
  content text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author text NOT NULL DEFAULT 'Anonymous',
  is_featured boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Categories: Public read access
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Posts: Public read access
CREATE POLICY "Anyone can view published posts"
  ON posts FOR SELECT
  TO anon, authenticated
  USING (published_at <= now());

-- Comments: Public read and insert access
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create comments"
  ON comments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);