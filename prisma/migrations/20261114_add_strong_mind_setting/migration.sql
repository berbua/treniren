-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "strongMindTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "strongMindPromptAnswered" BOOLEAN NOT NULL DEFAULT false;

-- Keep Strong Mind on for people who already logged it on a lead workout
INSERT INTO "user_profiles" ("id", "userId", "strongMindTrackingEnabled", "strongMindPromptAnswered", "updatedAt")
SELECT DISTINCT ON (w."userId") 'sm_' || md5(w."userId"), w."userId", true, true, NOW()
FROM "workouts" w
WHERE w."type" IN ('LEAD_ROCK', 'LEAD_ARTIFICIAL')
  AND w."mentalState" IS NOT NULL
  AND (
    jsonb_typeof(w."mentalState"->'beforeClimbing') = 'number'
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(w."mentalState"->'climbSections') = 'array' THEN w."mentalState"->'climbSections' ELSE '[]'::jsonb END
      ) c
      WHERE c->>'focusState' IS NOT NULL OR c->>'tookFall' IS NOT NULL OR c->>'comfortZone' IS NOT NULL
    )
  )
ON CONFLICT ("userId") DO UPDATE SET "strongMindTrackingEnabled" = true, "strongMindPromptAnswered" = true;
