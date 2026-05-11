'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useCoupleCode } from '../../../hooks/useCoupleCode';
import { usePlaces } from '../../../hooks/usePlaces';
import { Category } from '../../../types';

const LeafletMap = dynamic(() => import('../../../components/LeafletMap'), { ssr: false });

const FILTERS: { key: Category | 'all'; emoji: string; label: string }[] = [
  { key: 'all', emoji: '🗺️', label: 'All' },
  { key: 'restaurant', emoji: '🍽️', label: 'Restaurant' },
  { key: 'coffee', emoji: '☕', label: 'Coffee' },
  { key: 'bakery', emoji: '🥐', label: 'Bakery' },
  { key: 'bar', emoji: '🍸', label: 'Bar' },
  { key: 'dessert', emoji: '🍰', label: 'Dessert' },
  { key: 'brunch', emoji: '🥞', label: 'Brunch' },
];

export default function MapPage() {
  const { coupleCode } = useCoupleCode();
  const { visited } = usePlaces(coupleCode);
  const [filter, setFilter] = useState<Category | 'all'>('all');

  const filtered = filter === 'all' ? visited : visited.filter((p) => p.category === filter);

  return (
    <div className="relative w-full h-screen flex flex-col">
      {/* Overlay header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-card px-4 py-3 pointer-events-auto self-start">
          <h1 className="text-xl font-extrabold text-brown-dark">Our Map</h1>
          <p className="text-xs text-brown-mid">{visited.length} places visited</p>
        </div>
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-all ${
                filter === f.key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-brown-mid border-rose-100 hover:border-rose-300'
              }`}
            >
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
      </div>

      <LeafletMap places={filtered} className="flex-1" />

      {visited.length === 0 && (
        <div className="absolute bottom-24 left-4 right-4 z-10 bg-white rounded-2xl shadow-card p-4 text-center">
          <p className="text-2xl mb-1">📍</p>
          <p className="text-brown-mid text-sm">No places yet — tap + to add your first!</p>
        </div>
      )}
    </div>
  );
}
