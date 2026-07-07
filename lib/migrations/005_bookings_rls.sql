-- RLS policies for public booking creation (run if bookings insert fails with permission denied)
-- Safe to re-run.

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_anon_insert" ON bookings;
CREATE POLICY "bookings_anon_insert"
  ON bookings FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "bookings_anon_select_availability" ON bookings;
CREATE POLICY "bookings_anon_select_availability"
  ON bookings FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "bookings_staff_all" ON bookings;
CREATE POLICY "bookings_staff_all"
  ON bookings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Notifications: staff read; service role bypasses RLS for server inserts
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_staff_all" ON notifications;
CREATE POLICY "notifications_staff_all"
  ON notifications FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
