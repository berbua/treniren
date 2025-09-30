'use client';

import { useState } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { 
  saveOfflineWorkout, 
  generateOfflineId, 
  OfflineWorkout,
  addToSyncQueue 
} from '@/lib/offline-storage';

interface OfflineWorkoutFormProps {
  onClose: () => void;
}

export const OfflineWorkoutForm = ({ onClose }: OfflineWorkoutFormProps) => {
  const { isOnline } = useOffline();
  const [formData, setFormData] = useState({
    type: 'gym' as OfflineWorkout['type'],
    startTime: typeof window !== 'undefined' ? new Date().toISOString().slice(0, 16) : '2024-01-15T10:00',
    endTime: '',
    trainingVolume: 'TR3' as OfflineWorkout['trainingVolume'],
    preSessionFeel: 3,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const workout: OfflineWorkout = {
      id: generateOfflineId(),
      type: formData.type,
      startTime: formData.startTime,
      endTime: formData.endTime || undefined,
      trainingVolume: formData.trainingVolume,
      preSessionFeel: formData.preSessionFeel,
      notes: formData.notes || undefined,
      createdAt: typeof window !== 'undefined' ? new Date().toISOString() : '2024-01-15T10:00:00.000Z',
      synced: isOnline,
      exercises: [],
    };

    // Save to offline storage
    saveOfflineWorkout(workout);
    
    // If offline, add to sync queue
    if (!isOnline) {
      addToSyncQueue(workout);
    }

    // Close the form
    onClose();
    
    // Show success message
    alert(isOnline ? 'Workout saved and synced!' : 'Workout saved offline. It will sync when you\'re back online.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Add Workout {!isOnline && '(Offline)'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workout Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as OfflineWorkout['type'] })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="gym">Gym</option>
              <option value="bouldering">Bouldering</option>
              <option value="circuits">Circuits</option>
              <option value="lead_rock">Lead - Rock</option>
              <option value="lead_artificial">Lead - Artificial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time (optional)
            </label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          {formData.type !== 'gym' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Training Volume
              </label>
              <select
                value={formData.trainingVolume}
                onChange={(e) => setFormData({ ...formData, trainingVolume: e.target.value as OfflineWorkout['trainingVolume'] })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="TR1">TR1 - Very Light</option>
                <option value="TR2">TR2 - Light</option>
                <option value="TR3">TR3 - Moderate</option>
                <option value="TR4">TR4 - Hard</option>
                <option value="TR5">TR5 - Maximum</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pre-session Feel (1-5)
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.preSessionFeel}
              onChange={(e) => setFormData({ ...formData, preSessionFeel: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="text-sm text-gray-500">
              {formData.preSessionFeel} - {formData.preSessionFeel === 1 ? 'Very poor' : 
               formData.preSessionFeel === 2 ? 'Poor' : 
               formData.preSessionFeel === 3 ? 'Average' : 
               formData.preSessionFeel === 4 ? 'Good' : 'Excellent'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
              placeholder="Add any notes about your workout..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Workout
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
