UPDATE "Category"
SET "isSystem" = TRUE
WHERE "name" IN ('Savings', 'Debt');

INSERT INTO "Category" ("id", "name", "icon", "isSystem", "userId", "createdAt")
SELECT
  gen_random_uuid(),
  'Debt',
  '💳',
  TRUE,
  NULL,
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM "Category"
  WHERE "name" = 'Debt' AND "userId" IS NULL
);
