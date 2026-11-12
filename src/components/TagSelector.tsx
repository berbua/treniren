'use client';

import { useState } from 'react';
import { Tag } from '@/types/workout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Chip, Input, Overline } from './ui';

interface TagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  availableTags: Tag[];
  onCreateTag?: (name: string, color: string) => void;
}

// Stored on the tag itself (data, not theme colours)
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
  const { t } = useLanguage()
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
    <div className="space-y-2">
      <Overline>Tags</Overline>

      {/* Selected Tags */}
      {selectedTagIds.length > 0 && (
        <div className="flex flex-wrap gap-x-2">
          {selectedTagIds.map(tagId => {
            const tag = availableTags.find(t => t.id === tagId);
            if (!tag) return null;

            return (
              <button
                type="button"
                key={tagId}
                onClick={() => handleTagToggle(tagId)}
                aria-label={`${tag.name} ×`}
                className="min-h-11 inline-flex items-center"
              >
                <Chip color={tag.color} className="pr-2">
                  {tag.name}
                  <span aria-hidden className="text-base leading-none opacity-70">×</span>
                </Chip>
              </button>
            );
          })}
        </div>
      )}

      {/* Available Tags */}
      <div className="flex flex-wrap gap-x-2">
        {availableTags
          .filter(tag => !selectedTagIds.includes(tag.id))
          .map(tag => (
            <button
              type="button"
              key={tag.id}
              onClick={() => handleTagToggle(tag.id)}
              className="group min-h-11 inline-flex items-center"
            >
              <span className="inline-flex items-center gap-1.5 min-h-7 px-2.5 rounded-uc-chip border border-uc-border text-[13px] font-bold text-uc-text group-hover:border-uc-primary transition-colors">
                <span aria-hidden className="size-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </span>
            </button>
          ))}
      </div>

      {/* Create New Tag */}
      {onCreateTag && (
        <div>
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="min-h-11 inline-flex items-center gap-1.5 text-sm font-bold text-uc-primary hover:underline"
            >
              <span aria-hidden className="text-lg leading-none">+</span>
              Create new tag
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-uc-surface border border-uc-border rounded-uc-card">
              <h4 className="text-base font-bold text-uc-text">Create new tag</h4>
              <Input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder={t('workouts.placeholders.tagName') || 'Tag name'}
                aria-label={t('workouts.placeholders.tagName') || 'Tag name'}
                autoFocus
              />

              <div role="group" aria-labelledby="tag-color-label">
                <p id="tag-color-label" className="mb-1.5 text-[13px] font-semibold text-uc-text-muted">Color:</p>
                <div className="grid grid-cols-5 gap-2">
                  {predefinedColors.map(color => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      aria-label={color}
                      aria-pressed={newTagColor === color}
                      className={`flex min-h-11 items-center justify-center rounded-uc-input border transition-colors ${
                        newTagColor === color ? 'border-uc-text border-2' : 'border-uc-border hover:border-uc-primary'
                      }`}
                    >
                      <span aria-hidden className="size-6 rounded-full" style={{ backgroundColor: color }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTagName('');
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                  Create
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
