-- Simplify graduation package duration labels (booking UI)
UPDATE packages SET duration = '30 mins' WHERE id = 'fico-package';
UPDATE packages SET duration = '2 hours' WHERE id = 'mana-makeup';
