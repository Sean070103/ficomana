-- Retire FICO 3 and FICO 4 from the public package catalog.
UPDATE packages
SET is_active = false
WHERE id IN ('fico-3', 'fico-4');
