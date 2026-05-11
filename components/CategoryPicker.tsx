'use client';
import { Category } from '../types';

const CATEGORIES: { value: Category; label: string; emoji: string; color: string }[] = [
  { value: 'restaurant', label: 'Restaurant', emoji: '🍽️', color: '#C4614A' },
  { value: 'coffee', label: 'Coffee', emoji: '☕', color: '#8B5E3C' },
  { value: 'bakery', label: 'Bakery', emoji: '🥐', color: '#D4A853' },
  { value: 'bar', label: 'Bar', emoji: '🍸', color: '#5E6FA8' },
  { value: 'dessert', label: 'Dessert', emoji: '🍰', color: '#C4618A' },
  { value: 'brunch', label: 'Brunch', emoji: '🥞', color: '#6A9E6A' },
  { value: 'other', label: 'Other', emoji: '📍', color: '#8B7E72' },
];

interface Props {
  value: Category;
  onChange: (c: Category) => void;
}

export default function CategoryPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const active = cat.value === value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(cat.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
              active ? 'text-white border-transparent' : 'bg-white text-brown-mid border-rose-100 hover:border-rose-200'
            }`}
            style={active ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
