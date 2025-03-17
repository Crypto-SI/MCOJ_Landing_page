-- SQL function to check if a table exists
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = $1
  );
END;
$$;

-- SQL function to execute SQL statements (for creating tables)
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Create the required tables if they don't exist
-- Gallery Table
CREATE TABLE IF NOT EXISTS public.gallery (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  src TEXT NOT NULL UNIQUE,
  placeholder_position INTEGER,
  is_archived BOOLEAN DEFAULT false
);

-- Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  venue TEXT NOT NULL,
  eventName TEXT NOT NULL,
  address TEXT,
  postcode TEXT,
  timeStart TEXT,
  timeEnd TEXT,
  ticketLink TEXT,
  position INTEGER,
  is_archived BOOLEAN DEFAULT false
);

-- Videos Table
CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  src TEXT NOT NULL,
  thumbnailSrc TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  autoThumbnail BOOLEAN DEFAULT false
); 