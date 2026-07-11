-- Per-slot blocks (studio stays open; admin blocks individual MANA session slots)
CREATE TABLE IF NOT EXISTS blocked_slots (
  date DATE NOT NULL,
  slot_id VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  PRIMARY KEY (date, slot_id)
);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_slots_public_read" ON blocked_slots;
CREATE POLICY "blocked_slots_public_read"
  ON blocked_slots FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "blocked_slots_staff_write" ON blocked_slots;
CREATE POLICY "blocked_slots_staff_write"
  ON blocked_slots FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Optional: drop legacy full-day table if you created it earlier
-- DROP TABLE IF EXISTS blocked_days;
