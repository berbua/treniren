/**
 * Utility functions for exporting data to CSV and JSON formats
 */

export interface ExportData {
  metadata: {
    exportDate: string;
    userId: string;
    userEmail: string;
    userName: string | null;
    version: string;
  };
  user: any;
  profile: any;
  workouts: any[];
  events: any[];
  exercises: any[];
  routines: any[];
  fingerboardProtocols: any[];
  fingerboardTestingProtocols: any[];
  fingerboardTestResults: any[];
  tags: any[];
  plans: any[];
}

/**
 * Convert data to JSON string and download as file
 */
export function downloadJSON(data: ExportData, filename: string = 'treniren-export.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) return headers.join(',') + '\n';
  
  const rows = data.map(item => {
    return headers.map(header => {
      const value = getNestedValue(item, header);
      // Escape commas, quotes, and newlines
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

/**
 * Convert workouts to CSV format
 */
function workoutsToCSV(workouts: any[]): string {
  if (workouts.length === 0) return 'No workouts found\n';
  
  const headers = [
    'id',
    'type',
    'startTime',
    'endTime',
    'trainingVolume',
    'preSessionFeel',
    'dayAfterTiredness',
    'focusLevel',
    'sector',
    'notes',
    'gratitude',
    'improvements',
    'exercises',
    'tags',
    'fingerboardHangs'
  ];
  
  const rows = workouts.map(workout => ({
    id: workout.id,
    type: workout.type,
    startTime: workout.startTime,
    endTime: workout.endTime || '',
    trainingVolume: workout.trainingVolume || '',
    preSessionFeel: workout.preSessionFeel || '',
    dayAfterTiredness: workout.dayAfterTiredness || '',
    focusLevel: workout.focusLevel || '',
    sector: workout.sector || '',
    notes: workout.notes || '',
    gratitude: workout.gratitude || '',
    improvements: workout.improvements || '',
    exercises: workout.exercises.map((e: any) => `${e.exerciseName} (${e.sets.length} sets)`).join('; '),
    tags: workout.tags.map((t: any) => t.name).join('; '),
    fingerboardHangs: workout.fingerboardHangs.length > 0 ? `${workout.fingerboardHangs.length} hangs` : ''
  }));
  
  return arrayToCSV(rows, headers);
}

/**
 * Convert events to CSV format
 */
function eventsToCSV(events: any[]): string {
  if (events.length === 0) return 'No events found\n';
  
  const headers = ['id', 'type', 'title', 'date', 'startTime', 'endTime', 'description', 'location', 'severity', 'status', 'destination', 'tags'];
  
  const rows = events.map(event => ({
    id: event.id,
    type: event.type,
    title: event.title,
    date: event.date,
    startTime: event.startTime || '',
    endTime: event.endTime || '',
    description: event.description || '',
    location: event.location || '',
    severity: event.severity || '',
    status: event.status || '',
    destination: event.destination || '',
    tags: event.tags.map((t: any) => t.name).join('; ')
  }));
  
  return arrayToCSV(rows, headers);
}

/**
 * Convert exercises to CSV format
 */
function exercisesToCSV(exercises: any[]): string {
  if (exercises.length === 0) return 'No exercises found\n';
  
  const headers = ['id', 'name', 'category', 'defaultUnit', 'createdAt'];
  
  return arrayToCSV(exercises, headers);
}

/**
 * Convert all data to a comprehensive CSV file
 */
export function downloadCSV(data: ExportData, filename: string = 'treniren-export.csv') {
  const sections: string[] = [];
  
  // Metadata
  sections.push('=== EXPORT METADATA ===');
  sections.push(`Export Date: ${data.metadata.exportDate}`);
  sections.push(`User: ${data.metadata.userName} (${data.metadata.userEmail})`);
  sections.push(`Version: ${data.metadata.version}`);
  sections.push('');
  
  // Workouts
  sections.push('=== WORKOUTS ===');
  sections.push(workoutsToCSV(data.workouts));
  sections.push('');
  
  // Events
  sections.push('=== EVENTS ===');
  sections.push(eventsToCSV(data.events));
  sections.push('');
  
  // Exercises
  sections.push('=== EXERCISES ===');
  sections.push(exercisesToCSV(data.exercises));
  sections.push('');
  
  // Tags
  if (data.tags.length > 0) {
    sections.push('=== TAGS ===');
    sections.push(arrayToCSV(data.tags, ['id', 'name', 'color', 'createdAt']));
    sections.push('');
  }
  
  // Routines
  if (data.routines.length > 0) {
    sections.push('=== ROUTINES ===');
    const routineRows = data.routines.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      exerciseCount: r.exercises.length,
      variationCount: r.variations.length
    }));
    sections.push(arrayToCSV(routineRows, ['id', 'name', 'description', 'exerciseCount', 'variationCount']));
    sections.push('');
  }
  
  // Fingerboard Protocols
  if (data.fingerboardProtocols.length > 0) {
    sections.push('=== FINGERBOARD PROTOCOLS ===');
    const protocolRows = data.fingerboardProtocols.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      hangCount: p.hangs.length
    }));
    sections.push(arrayToCSV(protocolRows, ['id', 'name', 'description', 'hangCount']));
    sections.push('');
  }
  
  // Plans
  if (data.plans.length > 0) {
    sections.push('=== PLANS ===');
    const planRows = data.plans.map(p => ({
      id: p.id,
      date: p.date,
      title: p.title,
      label: p.label || '',
      notes: p.notes || '',
      tags: p.tags.map((t: any) => t.name).join('; ')
    }));
    sections.push(arrayToCSV(planRows, ['id', 'date', 'title', 'label', 'notes', 'tags']));
    sections.push('');
  }
  
  const csvContent = sections.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all data - fetches from API and downloads
 */
export async function exportAllData(format: 'json' | 'csv' = 'json'): Promise<void> {
  try {
    const response = await fetch('/api/export/data');
    
    if (!response.ok) {
      throw new Error('Failed to fetch export data');
    }
    
    const data: ExportData = await response.json();
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `treniren-export-${timestamp}.${format === 'json' ? 'json' : 'csv'}`;
    
    if (format === 'json') {
      downloadJSON(data, filename);
    } else {
      downloadCSV(data, filename);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

