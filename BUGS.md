# Bug list (app review, 2026-11-12)

Found by a code review of the whole app. ✅ = fixed (merged to main in 630d9be), ⬜ = open.
Line numbers are from the review and may have shifted.

## Security / privacy
1. ✅ Any logged-in user could send push notifications to any other user — `src/app/api/push/send/route.ts`
2. ✅ Site password gate could redirect to an outside site (`?next=/\evil.com`) — `src/lib/site-gate.ts`
3. ✅ Data leaked between accounts on a shared device (SW API cache, offline workouts, cycle state) — `src/lib/account-data.ts`, `OfflineSyncManager.tsx`, `CycleContext.tsx`
   - ⬜ Offline workouts saved before the fix have no `userId` and still upload for whoever signs in next
   - ⬜ Offline indicator's pending count includes other accounts' queued workouts (display only)
4. ✅ Routines can link to another user's exercises (no ownership check on `exerciseId`; also no Zod schema, duplicate/unknown ids → 500 with raw Prisma error) — `src/app/api/routines/route.ts:86`, `src/app/api/routines/[id]/route.ts:122`
5. ✅ Middleware treats every route as public (`'/'` in `publicRoutes` + `startsWith`) — `src/middleware.ts`

## Broken features
6. ✅ Users who signed up with capitals in their email couldn't log in — `findUserByEmail` in `src/lib/auth.ts`
7. ✅ "Forgot password" never sent an email — now SMTP via `src/lib/email.ts` (needs `EMAIL_SERVER_*`, `EMAIL_FROM` on Vercel)
   - ✅ Old reset links stayed valid; ✅ reset race; ✅ forgot-password had no rate limit
   - ⬜ Password change doesn't sign out existing sessions (30-day JWT) — `src/lib/auth.ts`
8. ✅ Registration blocked (429) after a few normal saves — rate limiters shared one counter — `src/lib/rate-limit.ts`
9. ✅ Clearing exercises / hangs / gratitude / improvements / routine variation in the workout edit form doesn't save (sent as `undefined`, PUT skips them) — `src/components/EnhancedWorkoutForm.tsx:388-392, 432-435`
10. ✅ Tapping a push notification doesn't open the app (only opened on `explore` action; now focuses an open window or opens one, follows same-origin `data.url`) — `public/sw.js:352-362`
11. ✅ Failed Google sign-in shows a 404 (`pages.error: '/auth/error'` but no such page; now goes to sign-in page, which shows the error) — `src/lib/auth.ts`
12. ✅ Exercise detail page doesn't load progression chart / records on first open (`quickStats` missing from effect deps; effect now re-runs once stats show the exercise was used) — `src/app/exercises/[id]/page.tsx:63-67`
13. ✅ Saving fails with 400 when a loaded routine repeats an exercise already in the workout (`handleLoadRoutine` doesn't dedupe; API counts unique ids); now skips exercises already in the workout, API returns a clear duplicate error — `src/components/WorkoutExerciseTracker.tsx:117-139`
14. ✅ Data export leaves out logged periods (`Period` model never exported); now exported as `periods` — `src/app/api/export/data/route.ts`

## Wrong numbers / dates
15. ✅ Calendar month view skips a month when navigating on the 29th–31st (`setMonth` overflow; day now clamped to the target month) — `src/app/calendar/page.tsx:454-472`
16. ✅ Trip/deload "day N/M" one too low ("0/3" on first day; UTC-midnight start vs local-midnight cell; now compares day numbers) — `src/app/calendar/page.tsx:67-76`
17. ⬜ Period end date can be before start date (no check client or server); period then vanishes from calendar and bypasses the overlap check; no DB constraint against double-tap duplicates — `src/app/cycle/page.tsx` (PeriodFormModal), `src/app/api/periods/route.ts:8-13`, `src/app/api/periods/[id]/route.ts:8-13`
18. ⬜ "Max reps" record uses reps of the best (weight×reps) set, not highest reps — `src/lib/progression-service.ts:295-298, 316-319`
19. ⬜ Exercise quick stats: "last set" ordered by `createdAt` instead of `setNumber`; shows "never used" if latest workout has no sets — `src/app/api/exercises/[id]/quick-stats/route.ts:64-69, 78-86` (same pattern in `src/app/api/exercises/[id]/route.ts:35-40`)
20. ⬜ Strong Mind project goals get duplicate ids after reload (counter seeded only from process goals) — `src/app/strong-mind/page.tsx:118-124, 325`
21. ⬜ Injury-by-phase stats ignore the user-entered `cycleDay` / `cycleDayManuallySet` — `src/lib/statistics-service.ts:442-445`
22. ✅ Dashboard Events tile capped at 50 (uses page length, not `pagination.total`) — `src/app/dashboard/page.tsx:148`
23. ⬜ Workouts page: after adding a workout, list shows page 1 but pager keeps the old page — `src/app/workouts/page.tsx:259, 272, 857` (events: `:415`)

## Smaller issues (all open)
- ⬜ Fingerboard test results saved with `Promise.all`, no transaction → partial save + duplicates on retry; reminder upsert unvalidated — `src/app/api/fingerboard-test-results/route.ts:136-185`
- ⬜ Fingerboard chart plots missing values as 0 and same-day retests overwrite each other — `src/components/FingerboardTestChart.tsx:56-74`
- ⬜ Weight/reps/RIR 0 stored as null on create (`|| null`) but kept on edit (`??`) — `src/app/api/workouts/route.ts:216-235`
- ⬜ Deleted reminders reappear and re-send push on every app open (dedupe based on local message list); duplicates across devices — `src/lib/cycle-notifications.ts:106-125`, `src/lib/test-reminder-notifications.ts:131-137`, `src/contexts/NotificationContext.tsx`
- ⬜ Offline workout uploaded twice if response is lost (server ignores `details.offlineId`) — `src/lib/offline-sync.ts`
- ⬜ Offline workout rejected by the server retries forever with an error toast, can't be discarded — `src/lib/offline-sync.ts`, `src/lib/offline-storage.ts`
- ⬜ PUT without `description` wipes it — `src/app/api/fingerboard-protocols/[id]/route.ts:94`, `src/app/api/fingerboard-testing-protocols/[id]/route.ts:99`, `src/app/api/routines/[id]/route.ts:109`
- ⬜ Non-numeric `page`/`limit` → 500 — `src/app/api/workouts/route.ts:26-28`, `src/app/api/events/route.ts:26-28`
- ⬜ `planId` on workout create not ownership-checked; unknown id → 500 — `src/app/api/workouts/route.ts:203`
- ⬜ Routine variations can reorder after edit (all recreated with same `createdAt`) — `src/app/api/routines/[id]/route.ts:115-163`
- ⬜ Goals configurator mutates profile goal objects; Cancel doesn't discard edits — `src/components/GoalsConfigurator.tsx:87-95`
- ⬜ Workouts list endpoint has no `orderBy` for exercises/sets; editing from the list can reorder sets — `src/app/api/workouts/route.ts:37-43`
- ⬜ Signed-out offline device can still show the previous user as signed in via cached `/api/auth/session` (now cleared on sign-out via the logout page, but not on session expiry)

## Suggested next
#15 + #16 (calendar), #9 (workout edit loses changes), (#4 + #5 fixed, not yet committed).
