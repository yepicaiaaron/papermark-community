-- Community edition: every team gets the unlimited plan.
ALTER TABLE "Team" ALTER COLUMN "plan" SET DEFAULT 'datarooms-unlimited';
UPDATE "Team" SET "plan" = 'datarooms-unlimited';
