-- Enable the UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  src TEXT NOT NULL,
  thumbnailSrc TEXT NOT NULL,
  order_index INTEGER,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on is_archived for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_is_archived ON videos(is_archived);

-- Set up Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
-- Everyone can read videos
CREATE POLICY "Videos are viewable by everyone" 
ON videos FOR SELECT USING (true);

-- Only authenticated users can insert, update or delete
CREATE POLICY "Videos can be inserted by authenticated users only" 
ON videos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Videos can be updated by authenticated users only" 
ON videos FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Videos can be deleted by authenticated users only" 
ON videos FOR DELETE USING (auth.role() = 'authenticated'); 