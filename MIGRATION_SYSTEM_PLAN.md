# Data Migration System Architecture Plan

## Overview

This document outlines the architecture for migrating data between different schema versions when importing exported data.

## Goals

1. Support importing data from older export versions
2. Transform data to match current schema
3. Handle missing fields gracefully
4. Validate data integrity after migration
5. Provide clear error messages for unsupported versions

## Architecture Components

### 1. Version Detection

```typescript
interface VersionInfo {
  version: string;        // Legacy field
  schemaVersion: string;   // Current field
  exportDate: string;
}

function detectVersion(data: any): VersionInfo {
  // Check for schemaVersion first (newer exports)
  // Fall back to version field (older exports)
  // Default to '1.0' if neither exists
}
```

### 2. Migration Registry

```typescript
type MigrationFunction = (data: any) => any;

interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: MigrationFunction;
}

const migrations: Migration[] = [
  {
    fromVersion: '1.0',
    toVersion: '1.1',
    migrate: migrate_1_0_to_1_1
  },
  // Future migrations...
];
```

### 3. Migration Pipeline

```
Import Data
    ↓
Parse JSON
    ↓
Detect Version
    ↓
Check if Supported
    ↓
Calculate Migration Path
    ↓
Apply Migrations Sequentially
    ↓
Validate Against Current Schema
    ↓
Import to Database
```

### 4. Migration Functions

Each migration function should:

1. **Transform data structure**
   - Add missing fields with defaults
   - Remove deprecated fields
   - Rename fields if needed
   - Transform enum values

2. **Handle relationships**
   - Update foreign key references
   - Create missing related entities
   - Validate relationship integrity

3. **Preserve data**
   - Never lose user data
   - Use sensible defaults for missing fields
   - Log warnings for data that can't be migrated

### 5. Validation Layer

After migration, validate:

- Required fields are present
- Enum values are valid
- Date formats are correct
- Relationships are valid
- Data types match schema

## Example Migration: 1.0 → 1.1

```typescript
function migrate_1_0_to_1_1(data: any): any {
  // Add schemaVersion if missing
  if (!data.metadata.schemaVersion) {
    data.metadata.schemaVersion = '1.1';
  }
  
  // Add new data types (empty arrays if not present)
  if (!data.fingerboardProtocols) {
    data.fingerboardProtocols = [];
  }
  
  if (!data.fingerboardTestingProtocols) {
    data.fingerboardTestingProtocols = [];
  }
  
  if (!data.fingerboardTestResults) {
    data.fingerboardTestResults = [];
  }
  
  // No breaking changes, just additions
  return data;
}
```

## Implementation Strategy

### Phase 1: Foundation
1. Create version detection utility
2. Create migration registry
3. Implement basic migration pipeline
4. Add validation layer

### Phase 2: First Migration
1. Implement 1.0 → 1.1 migration
2. Test with sample data
3. Add error handling

### Phase 3: Import Feature
1. Create import API endpoint
2. Add preview functionality
3. Implement dry-run mode
4. Add user confirmation flow

### Phase 4: Advanced Features
1. Selective import (choose data types)
2. Duplicate detection and handling
3. Conflict resolution UI
4. Rollback capability

## Error Handling

### Unsupported Version
```typescript
if (!isVersionSupported(version)) {
  throw new Error(
    `Version ${version} is not supported. ` +
    `Minimum supported version: ${MIN_SUPPORTED_VERSION}`
  );
}
```

### Migration Failure
```typescript
try {
  migratedData = applyMigration(data, fromVersion, toVersion);
} catch (error) {
  throw new Error(
    `Failed to migrate data from ${fromVersion} to ${toVersion}: ${error.message}`
  );
}
```

### Validation Failure
```typescript
const validationErrors = validateData(migratedData);
if (validationErrors.length > 0) {
  throw new Error(
    `Data validation failed: ${validationErrors.join(', ')}`
  );
}
```

## Testing Strategy

1. **Unit Tests**
   - Test each migration function independently
   - Test version detection
   - Test validation logic

2. **Integration Tests**
   - Test full migration pipeline
   - Test with real export files from different versions
   - Test error scenarios

3. **Manual Testing**
   - Export data from current version
   - Manually modify version number
   - Test import with modified file

## Future Considerations

1. **Backward Compatibility**
   - Keep old migration functions even after schema changes
   - Document deprecation timeline

2. **Performance**
   - Optimize for large datasets
   - Consider streaming for very large files

3. **User Experience**
   - Show migration progress
   - Display what changed during migration
   - Allow user to review migrated data before import

## File Structure

```
src/
├── lib/
│   ├── data-version.ts          # Version constants
│   ├── data-migration.ts         # Migration functions
│   ├── data-validator.ts         # Validation logic
│   └── data-import.ts            # Import utilities
├── app/
│   └── api/
│       └── import/
│           └── data/
│               └── route.ts     # Import API endpoint
└── components/
    └── DataImportModal.tsx       # Import UI component
```

## Migration Best Practices

1. **Always preserve data** - Never delete user data during migration
2. **Use defaults** - Provide sensible defaults for missing fields
3. **Log changes** - Keep track of what was migrated
4. **Test thoroughly** - Test with real data from previous versions
5. **Document changes** - Update version history in export format docs
6. **Increment carefully** - Only increment version for breaking changes

## Version Increment Guidelines

Increment schema version when:
- ✅ Adding new data types to export
- ✅ Removing data types from export
- ✅ Changing field names
- ✅ Changing field types
- ✅ Adding/removing required fields
- ✅ Changing enum values
- ✅ Changing relationship structures

Do NOT increment for:
- ❌ Adding optional fields (backward compatible)
- ❌ Bug fixes
- ❌ Performance improvements
- ❌ UI changes

