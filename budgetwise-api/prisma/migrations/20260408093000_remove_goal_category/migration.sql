UPDATE "Goal"
SET "categoryId" = NULL
WHERE "categoryId" IS NOT NULL;

DROP INDEX IF EXISTS "Goal_categoryId_idx";

ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_categoryId_fkey";

ALTER TABLE "Goal" DROP COLUMN IF EXISTS "categoryId";
