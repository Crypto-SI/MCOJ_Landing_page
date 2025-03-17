-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue TEXT NOT NULL,
  venue_postcode TEXT,
  description TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos Table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  src TEXT NOT NULL, -- URL to video file in Storage
  thumbnailSrc TEXT NOT NULL, -- URL to thumbnail in Storage
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  src TEXT NOT NULL, -- URL to image in Storage
  position INTEGER NOT NULL, -- Position in the gallery grid (1-8)
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins Table (for authentication purposes)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create policies to allow authenticated access
-- Video policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

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

-- Events policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Everyone can read events
CREATE POLICY "Events are viewable by everyone" 
ON events FOR SELECT USING (true);

-- Only authenticated users can insert, update or delete
CREATE POLICY "Events can be inserted by authenticated users only" 
ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Events can be updated by authenticated users only" 
ON events FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Events can be deleted by authenticated users only" 
ON events FOR DELETE USING (auth.role() = 'authenticated');

-- Gallery policies
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Everyone can read gallery items
CREATE POLICY "Gallery items are viewable by everyone" 
ON gallery FOR SELECT USING (true);

-- Only authenticated users can insert, update or delete
CREATE POLICY "Gallery items can be inserted by authenticated users only" 
ON gallery FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Gallery items can be updated by authenticated users only" 
ON gallery FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Gallery items can be deleted by authenticated users only" 
ON gallery FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at(); 