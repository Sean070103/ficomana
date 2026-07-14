-- Migration: editor delivers final edited photos via Google Drive link
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS edited_photo_link TEXT,
ADD COLUMN IF NOT EXISTS edited_photo_delivered_at TIMESTAMP WITH TIME ZONE;
