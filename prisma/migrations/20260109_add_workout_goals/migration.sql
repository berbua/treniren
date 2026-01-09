-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "weeklyWorkoutGoal" INTEGER DEFAULT 3,
ADD COLUMN     "monthlyWorkoutGoal" INTEGER,
ADD COLUMN     "useAutoMonthlyGoal" BOOLEAN NOT NULL DEFAULT true;
