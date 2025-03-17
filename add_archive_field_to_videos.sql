-- Add is_archived field to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Create index on is_archived field for more efficient filtering
CREATE INDEX IF NOT EXISTS idx_videos_is_archived ON videos(is_archived);

-- Update any existing videos to explicitly set is_archived to false
UPDATE videos SET is_archived = FALSE WHERE is_archived IS NULL; 