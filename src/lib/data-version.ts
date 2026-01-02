/**
 * Data Export/Import Version Management
 * 
 * This file manages schema versions for data exports and imports.
 * Increment SCHEMA_VERSION whenever the export format changes.
 */

/**
 * Current schema version for data exports
 * 
 * Version history:
 * - 1.0: Initial export format (workouts, events, exercises, routines, tags, plans)
 * - 1.1: Added fingerboard protocols, fingerboard testing protocols, fingerboard test results
 * 
 * When to increment:
 * - Adding new data types to export
 * - Changing field names or types
 * - Adding/removing required fields
 * - Changing relationship structures
 * - Modifying enum values
 */
export const SCHEMA_VERSION = '1.1';

/**
 * Minimum supported import version
 * Versions below this cannot be imported
 */
export const MIN_SUPPORTED_VERSION = '1.0';

/**
 * Check if a version is supported for import
 */
export function isVersionSupported(version: string): boolean {
  const versionNum = parseFloat(version);
  const minVersionNum = parseFloat(MIN_SUPPORTED_VERSION);
  return versionNum >= minVersionNum;
}

/**
 * Get the migration path from one version to another
 * Returns array of versions that need to be applied
 */
export function getMigrationPath(fromVersion: string, toVersion: string): string[] {
  const from = parseFloat(fromVersion);
  const to = parseFloat(toVersion);
  
  if (from >= to) {
    return []; // No migration needed
  }
  
  const path: string[] = [];
  for (let v = from + 0.1; v <= to; v += 0.1) {
    path.push(v.toFixed(1));
  }
  
  return path;
}

/**
 * Export format metadata structure
 */
export interface ExportMetadata {
  exportDate: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  version: string; // Legacy field for backward compatibility
  schemaVersion: string; // Current schema version
}




