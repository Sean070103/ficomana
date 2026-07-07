-- Supabase Auth + RLS for FICO MANA admin
-- Run in Supabase SQL Editor after creating staff users in Authentication → Users

-- Bookings: public can create; staff (authenticated) can read/update
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

-- Notifications: staff only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_staff_all" ON notifications;
CREATE POLICY "notifications_staff_all"
  ON notifications FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Email logs: staff only (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'email_logs') THEN
    ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "email_logs_staff_all" ON email_logs;
    CREATE POLICY "email_logs_staff_all"
      ON email_logs FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Packages catalog: public read, staff manage
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'packages') THEN
    ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "packages_public_read" ON packages;
    CREATE POLICY "packages_public_read"
      ON packages FOR SELECT TO anon, authenticated
      USING (is_active = true);
    DROP POLICY IF EXISTS "packages_staff_write" ON packages;
    CREATE POLICY "packages_staff_write"
      ON packages FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;
