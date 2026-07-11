-- Studio closed days — admin can block booking for specific dates
CREATE TABLE IF NOT EXISTS blocked_days (
  date DATE PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

ALTER TABLE blocked_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_days_public_read" ON blocked_days;
CREATE POLICY "blocked_days_public_read"
  ON blocked_days FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "blocked_days_staff_write" ON blocked_days;
CREATE POLICY "blocked_days_staff_write"
  ON blocked_days FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
