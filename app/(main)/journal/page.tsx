'use client';
import { useState } from 'react';
import { useCoupleCode } from '../../../hooks/useCoupleCode';
import { usePlaces } from '../../../hooks/usePlaces';
import PlaceCard from '../../../components/PlaceCard';
import { Place } from '../../../types';

const CAT_ICONS: Record<string, string> = {
  restaurant: '🍽️', coffee: '☕', bakery: '🥐',
  bar: '🍸', dessert: '🍰', brunch: '🥞', other: '📍',
};

function groupByMonth(places: Place[]) {
  const out: Record<string, Place[]> = {};
  places.forEach((p) => {
    const key = new Date(p.visitDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    out[key] = [...(out[key] ?? []), p];
  });
  return out;
}

export default function JournalPage() {
  const { coupleCode } = useCoupleCode();
  const { visited, loading } = usePlaces(coupleCode);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);

  const usedCats = Array.from(new Set(visited.map((p) => p.category)));

  const filtered = visited.filter((p) => {
    const matchesCat = catFilter === 'all' || p.category === catFilter;
    const matchesRating = ratingFilter === 0 || p.rating === ratingFilter;
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.category.includes(search.toLowerCase()) ||
      p.occasion?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesRating && matchesSearch;
  });

  const groups = groupByMonth(filtered);

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-8">
        {/* Header */}
        <h1 className="text-3xl font-extrabold text-brown-dark">Our Journal</h1>
        <p className="text-brown-mid text-sm mt-1">{visited.length} places visited</p>

        {/* Search */}
        <div className="mt-4 flex items-center gap-2 bg-white rounded-xl shadow-sm px-4 py-2.5 border border-rose-100">
          <span className="text-lg">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search places, categories, occasions…"
            className="flex-1 bg-transparent text-sm text-brown-dark outline-none placeholder:text-brown-light"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-brown-light hover:text-brown-mid text-lg">✕</button>
          )}
        </div>

        {/* Category filter */}
        {usedCats.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {['all', ...usedCats].map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                  catFilter === cat
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-rose-100 text-brown-mid hover:border-rose-300'
                }`}
              >
                {cat === 'all' ? '🗂 All' : `${CAT_ICONS[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
              </button>
            ))}
          </div>
        )}

        {/* Rating filter */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                ratingFilter === r
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-rose-100 text-brown-mid hover:border-rose-300'
              }`}
            >
              {r === 0 ? 'All ★' : '★'.repeat(r)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center mt-12">
            <div className="text-3xl animate-pulse">📖</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 gap-3 text-center">
            <div className="text-5xl">{search ? '🔍' : '📖'}</div>
            <p className="text-lg font-bold text-brown-dark">
              {search ? 'No results' : 'Your journal is empty'}
            </p>
            <p className="text-sm text-brown-mid">
              {search ? 'Try a different search term.' : 'Tap + to add your first place!'}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {Object.entries(groups).map(([month, places]) => (
              <div key={month}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-brown-mid uppercase tracking-wider">{month}</h2>
                  <span className="text-xs bg-rose-100 text-brown-mid px-2 py-0.5 rounded-full font-medium">{places.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {places.map((p) => <PlaceCard key={p.id} place={p} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
