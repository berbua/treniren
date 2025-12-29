# Documentation Files - Production Cleanup Guide

## ✅ KEEP (Essential for Production)

1. **README.md** - Main project documentation, essential for any repository
2. **PRODUCTION_DEPLOYMENT.md** - Deployment instructions, critical for production
3. **DATA_EXPORT_FORMAT.md** - Documents data export structure, important for users
4. **messages/README_CUSTOM_TRANSLATIONS.md** - User-facing documentation for custom translations
5. **ARCHITECTURE.md** - System architecture (if it exists and is useful)

## ⚠️ CONSIDER KEEPING (Useful but not critical)

1. **MIGRATION_SYSTEM_PLAN.md** - Documents future migration system (useful for maintenance)
2. **MOBILE_TESTING.md** - Testing guide (useful for future testing)

## 🗑️ REMOVE (Development/Planning docs - not needed in production)

### Planning Documents (can be archived or removed):
- `FINGERBOARD_PROTOCOL_PLAN.md`
- `FINGERBOARD_TESTING_PROTOCOL_PLAN.md`
- `EXERCISE_PACKS_IMPLEMENTATION_PLAN.md`
- `EXERCISE_VISIBILITY_STRATEGY.md`
- `MIGRATION_SYSTEM_PLAN.md` (or move to docs/archive)

### Implementation Complete Docs (historical, can be removed):
- `FINGERBOARD_PROTOCOL_IMPLEMENTATION.md`
- `FINGERBOARD_PROTOCOL_COMPLETE.md`
- `FINGERBOARD_GRIP_TYPE_UPDATE.md`
- `FINGERBOARD_HANG_FORM_UPDATE.md`
- `ROUTINES_IMPLEMENTATION_COMPLETE.md`
- `PROGRESSIVE_OVERLOAD_IMPLEMENTATION.md`
- `PROGRESSIVE_OVERLOAD_SETUP.md`

### Development Guides (not needed in production):
- `START_SERVER.md`
- `DEVELOPMENT_RULES.md`
- `APP_REVIEW_AND_RECOMMENDATIONS.md`

### Reference Material (can be removed):
- `menstruation-cycle-info.md` (reference material, not needed in codebase)

## Recommendation

**For Production Deployment:**
- Keep: README.md, PRODUCTION_DEPLOYMENT.md, DATA_EXPORT_FORMAT.md, messages/README_CUSTOM_TRANSLATIONS.md
- Optionally keep: ARCHITECTURE.md, MIGRATION_SYSTEM_PLAN.md (if useful for maintenance)
- Remove: All planning, implementation complete, and development guide docs

**Alternative:** Move removed docs to a `docs/archive/` folder if you want to keep them for reference but not clutter the root directory.

