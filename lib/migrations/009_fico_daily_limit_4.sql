-- FICO daily capacity reduced from 10 to 4
ALTER TABLE fico_spot_blocks DROP CONSTRAINT IF EXISTS fico_spot_blocks_spots_blocked_check;
ALTER TABLE fico_spot_blocks ADD CONSTRAINT fico_spot_blocks_spots_blocked_check
  CHECK (spots_blocked >= 0 AND spots_blocked <= 4);

UPDATE fico_spot_blocks SET spots_blocked = 4 WHERE spots_blocked > 4;
