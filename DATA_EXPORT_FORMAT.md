# Data Export Format Documentation

## Overview

This document describes the format of exported data from Treniren. The export format is versioned to support future schema changes and data migrations.

## Version Information

- **Current Schema Version**: 1.1
- **Minimum Supported Import Version**: 1.0
- **Export Format**: JSON

## File Structure

The exported JSON file contains the following top-level structure:

```json
{
  "metadata": {
    "exportDate": "ISO 8601 date string",
    "userId": "string",
    "userEmail": "string",
    "userName": "string | null",
    "version": "string (legacy, same as schemaVersion)",
    "schemaVersion": "string (current: '1.1')"
  },
  "user": { ... },
  "profile": { ... },
  "workouts": [ ... ],
  "events": [ ... ],
  "exercises": [ ... ],
  "routines": [ ... ],
  "fingerboardProtocols": [ ... ],
  "fingerboardTestingProtocols": [ ... ],
  "fingerboardTestResults": [ ... ],
  "tags": [ ... ],
  "plans": [ ... ]
}
```

## Metadata

The `metadata` object contains information about the export:

- `exportDate`: ISO 8601 timestamp of when the export was created
- `userId`: Unique identifier of the user
- `userEmail`: User's email address
- `userName`: User's display name (name or nickname)
- `version`: Legacy version field (maintained for backward compatibility)
- `schemaVersion`: Current schema version (increment when format changes)

## Data Types

### User

```json
{
  "id": "string",
  "email": "string",
  "name": "string | null",
  "nickname": "string | null",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

### Profile

```json
{
  "id": "string",
  "userId": "string",
  "photoUrl": "string | null",
  "googleSheetsUrl": "string | null",
  "cycleAvgLengthDays": "number",
  "lastPeriodDate": "ISO 8601 date string | null",
  "timezone": "string",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

### Workout

```json
{
  "id": "string",
  "planId": "string | null",
  "userId": "string",
  "type": "GYM | BOULDERING | CIRCUITS | LEAD_ROCK | LEAD_ARTIFICIAL | MENTAL_PRACTICE | FINGERBOARD",
  "startTime": "ISO 8601 date string",
  "endTime": "ISO 8601 date string | null",
  "trainingVolume": "TR1 | TR2 | TR3 | TR4 | TR5 | null",
  "details": "object | null",
  "preSessionFeel": "number | null (1-5)",
  "dayAfterTiredness": "number | null (1-5)",
  "focusLevel": "number | null",
  "notes": "string | null",
  "sector": "string | null",
  "mentalPracticeType": "MEDITATION | REFLECTING | OTHER | null",
  "timeOfDay": "array | null",
  "gratitude": "string | null",
  "improvements": "string | null",
  "mentalState": "object | null",
  "calendarEventId": "string | null",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string",
  "exercises": [
    {
      "id": "string",
      "exerciseId": "string",
      "exerciseName": "string",
      "exerciseCategory": "string | null",
      "order": "number",
      "sets": [
        {
          "id": "string",
          "workoutExerciseId": "string",
          "setNumber": "number",
          "reps": "number | null",
          "weight": "number | null",
          "rir": "number | null",
          "success": "boolean | null",
          "notes": "string | null",
          "createdAt": "ISO 8601 date string"
        }
      ]
    }
  ],
  "tags": [
    {
      "id": "string",
      "name": "string",
      "color": "string"
    }
  ],
  "fingerboardHangs": [
    {
      "id": "string",
      "workoutId": "string",
      "order": "number",
      "handType": "ONE_HAND | BOTH_HANDS",
      "gripType": "OPEN_HAND | CRIMP | SLOPER",
      "crimpSize": "number | null",
      "customDescription": "string | null",
      "load": "number | null",
      "unload": "number | null",
      "reps": "number | null",
      "timeSeconds": "number | null",
      "notes": "string | null",
      "createdAt": "ISO 8601 date string"
    }
  ],
  "planId": "string | null",
  "planTitle": "string | null"
}
```

### Event

```json
{
  "id": "string",
  "userId": "string",
  "type": "INJURY | PHYSIO | COMPETITION | TRIP | OTHER",
  "title": "string",
  "date": "ISO 8601 date string",
  "startTime": "ISO 8601 date string | null",
  "endTime": "ISO 8601 date string | null",
  "description": "string | null",
  "location": "string | null",
  "severity": "number | null (1-5)",
  "status": "string | null",
  "notes": "string | null",
  "tripStartDate": "ISO 8601 date string | null",
  "tripEndDate": "ISO 8601 date string | null",
  "destination": "string | null",
  "climbingType": "BOULDERING | SPORT_CLIMBING | null",
  "showCountdown": "boolean",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string",
  "tags": [
    {
      "id": "string",
      "name": "string",
      "color": "string"
    }
  ]
}
```

### Exercise

```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "category": "string | null",
  "defaultUnit": "string",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

### Routine

```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "description": "string | null",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string",
  "exercises": [
    {
      "id": "string",
      "exerciseId": "string",
      "exerciseName": "string",
      "exerciseCategory": "string | null",
      "order": "number",
      "notes": "string | null"
    }
  ],
  "variations": [
    {
      "id": "string",
      "routineId": "string",
      "name": "string",
      "description": "string | null",
      "defaultSets": "number | null",
      "defaultRepRangeMin": "number | null",
      "defaultRepRangeMax": "number | null",
      "defaultRIR": "number | null",
      "createdAt": "ISO 8601 date string",
      "updatedAt": "ISO 8601 date string"
    }
  ]
}
```

### Fingerboard Protocol

```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "description": "string | null",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string",
  "hangs": [
    {
      "id": "string",
      "protocolId": "string",
      "order": "number",
      "handType": "ONE_HAND | BOTH_HANDS",
      "gripType": "OPEN_HAND | CRIMP | SLOPER",
      "crimpSize": "number | null",
      "customDescription": "string | null",
      "defaultLoad": "number | null",
      "defaultUnload": "number | null",
      "defaultReps": "number | null",
      "defaultTimeSeconds": "number | null",
      "notes": "string | null"
    }
  ]
}
```

### Fingerboard Testing Protocol

```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "description": "string | null",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string",
  "testHangs": [
    {
      "id": "string",
      "protocolId": "string",
      "order": "number",
      "handType": "ONE_HAND | BOTH_HANDS",
      "gripType": "OPEN_HAND | CRIMP | SLOPER",
      "crimpSize": "number | null",
      "customDescription": "string | null",
      "targetLoad": "number | null",
      "targetTimeSeconds": "number | null",
      "notes": "string | null"
    }
  ]
}
```

### Fingerboard Test Result

```json
{
  "id": "string",
  "protocolId": "string",
  "testHangId": "string",
  "userId": "string",
  "date": "ISO 8601 date string",
  "handType": "ONE_HAND | BOTH_HANDS",
  "gripType": "OPEN_HAND | CRIMP | SLOPER",
  "crimpSize": "number | null",
  "customDescription": "string | null",
  "load": "number | null",
  "unload": "number | null",
  "timeSeconds": "number | null",
  "success": "boolean | null",
  "notes": "string | null",
  "createdAt": "ISO 8601 date string",
  "protocolName": "string"
}
```

### Tag

```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "color": "string",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

### Plan

```json
{
  "id": "string",
  "userId": "string",
  "date": "ISO 8601 date string",
  "title": "string",
  "label": "string | null",
  "notes": "string | null",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string",
  "tags": [
    {
      "id": "string",
      "name": "string",
      "color": "string"
    }
  ]
}
```

## Version History

### Version 1.1 (Current)
- Added `fingerboardProtocols` array
- Added `fingerboardTestingProtocols` array
- Added `fingerboardTestResults` array
- Added `schemaVersion` field to metadata

### Version 1.0 (Initial)
- Basic export format with workouts, events, exercises, routines, tags, plans
- User and profile data

## Migration Notes

When importing data:
1. Check `schemaVersion` in metadata
2. If version < current, apply migrations
3. Validate all data against current schema
4. Handle missing fields gracefully (use defaults or null)

## Date Format

All dates are in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

Example: `2024-01-15T10:30:00.000Z`

## Enum Values

### WorkoutType
- `GYM`
- `BOULDERING`
- `CIRCUITS`
- `LEAD_ROCK`
- `LEAD_ARTIFICIAL`
- `MENTAL_PRACTICE`
- `FINGERBOARD`

### TrainingVolume
- `TR1`
- `TR2`
- `TR3`
- `TR4`
- `TR5`

### EventType
- `INJURY`
- `PHYSIO`
- `COMPETITION`
- `TRIP`
- `OTHER`

### HandType
- `ONE_HAND`
- `BOTH_HANDS`

### GripType
- `OPEN_HAND`
- `CRIMP`
- `SLOPER`

## Notes

- All IDs are CUID strings
- All user-scoped data includes `userId`
- Relationships are resolved (e.g., exercises in workouts include exercise name)
- Tags are included as objects, not just IDs
- Dates are always ISO 8601 strings, never Date objects




