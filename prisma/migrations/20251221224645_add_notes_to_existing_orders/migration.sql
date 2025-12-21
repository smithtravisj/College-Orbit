-- Add "Notes" to all existing visiblePagesOrder values that don't have it
UPDATE "Settings"
SET "visiblePagesOrder" = jsonb_insert(
  "visiblePagesOrder",
  '{5}',
  '"Notes"'
)
WHERE "visiblePagesOrder" IS NOT NULL
  AND "visiblePagesOrder" ? 'Exams'
  AND NOT ("visiblePagesOrder" ? 'Notes');
