# Video Archive Feature Documentation

This document explains how to use the Video Archive feature, which allows you to store videos in the database but hide them from the public website.

## Purpose

The Video Archive feature enables you to:

- Keep videos in your database that aren't ready to be shown publicly
- Store older videos that you want to maintain but not feature on the site
- Easily toggle videos between active and archived status without having to re-upload them

## Database Changes

The feature adds an `is_archived` boolean field to the `videos` table. This field defaults to `false` for all existing and new videos.

## How to Run the Migration

To add the archive field to your database, run:

```bash
npm run migrate:videos-archive
```

This script will:
1. Connect to your Supabase database
2. Add the `is_archived` column to the videos table 
3. Create an index on the column for better query performance
4. Set all existing videos to have `is_archived = false` by default

## Using the Video Archive

### In the Admin Dashboard

1. Navigate to the Videos Management section in the admin dashboard
2. You'll see two tabs at the top: "Active Videos" and "Archived Videos"
3. Use these tabs to switch between viewing active and archived videos

### Uploading New Videos to Archive

When uploading a new video, you can check the "Add to archive" checkbox to immediately place it in the archive instead of showing it on the public site.

### Managing Archive Status

For each video, you'll see an "Archive" or "Unarchive" button, depending on its current status:

- **Archive**: Moves an active video to the archive (hides it from the public site)
- **Unarchive**: Makes an archived video active again (shows it on the public site)

## Technical Implementation

- The public VideoGallery component now only shows videos where `is_archived` is `false`
- The admin interface displays videos filtered by their archive status
- The API includes a new PUT endpoint to toggle a video's archive status
- Client utility functions support fetching either active or archived videos 