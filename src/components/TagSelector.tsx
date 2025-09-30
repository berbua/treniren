'use client';

import { useState } from 'react';
import { Tag } from '@/types/workout';

interface TagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  availableTags: Tag[];
  onCreateTag?: (name: string, color: string) => void;
}

const predefinedColors = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6b7280', // gray
];

export default function TagSelector({ 
  selectedTagIds, 
  onTagsChange, 
  availableTags, 
  onCreateTag 
}: TagSelectorProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(predefinedColors[0]);

  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = () => {
    if (newTagName.trim() && onCreateTag) {
      onCreateTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setShowCreateForm(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        🏷️ Tags
      </label>
      
      {/* Selected Tags */}
      {selectedTagIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTagIds.map(tagId => {
            const tag = availableTags.find(t => t.id === tagId);
            if (!tag) return null;
            
            return (
              <span
                key={tagId}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
                <button
                  onClick={() => handleTagToggle(tagId)}
                  className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Available Tags */}
      <div className="flex flex-wrap gap-2">
        {availableTags
          .filter(tag => !selectedTagIds.includes(tag.id))
          .map(tag => (
            <button
              key={tag.id}
              onClick={() => handleTagToggle(tag.id)}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <span
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </button>
          ))}
      </div>

      {/* Create New Tag */}
      {onCreateTag && (
        <div>
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Create new tag
            </button>
          ) : (
            <div className="space-y-2 p-3 border border-slate-300 dark:border-slate-600 rounded-lg">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                autoFocus
              />
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">Color:</span>
                <div className="flex space-x-1">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-4 h-4 rounded-full border-2 ${
                        newTagColor === color ? 'border-slate-900 dark:border-white' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTagName('');
                  }}
                  className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
