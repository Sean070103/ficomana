-- Migration: Add fields for client-selected raw photo filtering
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS raw_photo_link TEXT,
ADD COLUMN IF NOT EXISTS raw_photo_status VARCHAR(50) DEFAULT 'Pending Review',
ADD COLUMN IF NOT EXISTS raw_photo_notes TEXT,
ADD COLUMN IF NOT EXISTS raw_photo_submitted_at TIMESTAMP WITH TIME ZONE;
