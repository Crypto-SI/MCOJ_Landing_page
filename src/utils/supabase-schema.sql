-- MC OJ Landing Page Database Schema
-- Run this in your Supabase SQL Editor to set up all required tables

-- Enable the PostgreSQL extensions we need
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Gallery Table 
-- =============================================
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    filename TEXT NOT NULL,
    src TEXT NOT NULL,
    placeholder_position INTEGER,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Add a constraint to ensure placeholder_position is between 1 and 8 when not NULL
    CONSTRAINT valid_position CHECK (placeholder_position IS NULL OR (placeholder_position >= 1 AND placeholder_position <= 8)),
    -- Add a unique constraint for active positions (NULL is treated as different values)
    CONSTRAINT unique_active_position EXCLUDE (placeholder_position WITH =) WHERE (NOT is_archived AND placeholder_position IS NOT NULL)
);

-- Add index for faster querying by position and archive status
CREATE INDEX IF NOT EXISTS gallery_position_idx ON public.gallery (placeholder_position) WHERE placeholder_position IS NOT NULL;
CREATE INDEX IF NOT EXISTS gallery_archive_idx ON public.gallery (is_archived);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_gallery_updated_at
BEFORE UPDATE ON public.gallery
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Events Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date DATE NOT NULL,
    venue TEXT NOT NULL,
    event_name TEXT NOT NULL,
    address TEXT,
    postcode TEXT,
    time_start TEXT,
    time_end TEXT,
    ticket_link TEXT,
    position INTEGER,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Add constraint to ensure position is positive when not NULL
    CONSTRAINT valid_event_position CHECK (position IS NULL OR position >= 0)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS events_date_idx ON public.events (date);
CREATE INDEX IF NOT EXISTS events_archived_idx ON public.events (is_archived);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Booking Requests Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.booking_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    venue TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TEXT,
    event_type TEXT,
    additional_info TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    
    -- Add constraint to validate status values
    CONSTRAINT valid_status CHECK (status IN ('new', 'contacted', 'booked', 'declined', 'canceled'))
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS booking_status_idx ON public.booking_requests (status);
CREATE INDEX IF NOT EXISTS booking_date_idx ON public.booking_requests (event_date);
CREATE INDEX IF NOT EXISTS booking_email_idx ON public.booking_requests (email);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_booking_requests_updated_at
BEFORE UPDATE ON public.booking_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security Policies
-- Since we only have one admin user, we can use very simple policies

-- Allow any authenticated request to read/write to tables
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON public.gallery
    USING (auth.role() = 'authenticated');

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON public.events
    USING (auth.role() = 'authenticated');

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON public.booking_requests
    USING (auth.role() = 'authenticated');

-- Allow public read access to non-archived gallery and events
CREATE POLICY "Allow public read access to active gallery" ON public.gallery
    FOR SELECT USING (NOT is_archived);

CREATE POLICY "Allow public read access to active events" ON public.events
    FOR SELECT USING (NOT is_archived);

-- Allow anyone to insert a booking request (no authentication needed)
CREATE POLICY "Allow public to insert booking requests" ON public.booking_requests
    FOR INSERT WITH CHECK (true);

-- Only authenticated users can update or delete booking requests
CREATE POLICY "Allow authenticated to manage booking requests" ON public.booking_requests
    USING (auth.role() = 'authenticated');

-- Comment on tables for better documentation
COMMENT ON TABLE public.gallery IS 'Stores gallery images for the MC OJ website';
COMMENT ON TABLE public.events IS 'Stores events data for the MC OJ events diary';
COMMENT ON TABLE public.booking_requests IS 'Stores booking form submissions from website visitors'; 