-- Migration 015: stamp when raw selection is approved (editor 15-day deadline)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS raw_photo_approved_at TIMESTAMP WITH TIME ZONE;
