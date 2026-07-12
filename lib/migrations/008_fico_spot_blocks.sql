-- Admin-held FICO daily spots (reduces bookable capacity without closing the day)
CREATE TABLE IF NOT EXISTS fico_spot_blocks (
  date DATE PRIMARY KEY,
  spots_blocked INTEGER NOT NULL DEFAULT 0 CHECK (spots_blocked >= 0 AND spots_blocked <= 4),
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

ALTER TABLE fico_spot_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fico_spot_blocks_public_read" ON fico_spot_blocks;
CREATE POLICY "fico_spot_blocks_public_read"
  ON fico_spot_blocks FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "fico_spot_blocks_staff_write" ON fico_spot_blocks;
CREATE POLICY "fico_spot_blocks_staff_write"
  ON fico_spot_blocks FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
