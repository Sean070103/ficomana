-- FICO daily capacity restored to 10 slots
ALTER TABLE fico_spot_blocks DROP CONSTRAINT IF EXISTS fico_spot_blocks_spots_blocked_check;
ALTER TABLE fico_spot_blocks ADD CONSTRAINT fico_spot_blocks_spots_blocked_check
  CHECK (spots_blocked >= 0 AND spots_blocked <= 10);
