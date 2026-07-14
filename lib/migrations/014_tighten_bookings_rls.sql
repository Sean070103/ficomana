-- Migration 014: tighten bookings RLS
-- Public creates go through Next.js API + service role (bypasses RLS).
-- Do NOT allow anon to read full booking PII or insert rows via PostgREST.

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_anon_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_anon_select_availability" ON bookings;

-- Staff (authenticated Auth users) keep full access. Keep public signup OFF.
DROP POLICY IF EXISTS "bookings_staff_all" ON bookings;
CREATE POLICY "bookings_staff_all"
  ON bookings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
