'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCoupleCode } from '../../../hooks/useCoupleCode';
import { usePlaces } from '../../../hooks/usePlaces';
import StarRating from '../../../components/StarRating';

const CAT_COLORS: Record<string, string> = {
  restaurant: '#C4614A', coffee: '#8B5E3C', bakery: '#D4A853',
  bar: '#5E6FA8', dessert: '#C4618A', brunch: '#6A9E6A', other: '#8B7E72',
};
const CAT_ICONS: Record<string, string> = {
  restaurant: '🍽️', coffee: '☕', bakery: '🥐',
  bar: '🍸', dessert: '🍰', brunch: '🥞', other: '📍',
};

export default function StatsPage() {
  const { coupleCode, clearCoupleCode } = useCoupleCode();
  const { visited, wishlist } = usePlaces(coupleCode);
  const router = useRouter();
  const [leaderboardCat, setLeaderboardCat] = useState('all');

  const ratedPlaces = visited.filter((p) => p.rating > 0);
  const avgRating = ratedPlaces.length
    ? (ratedPlaces.reduce((s, p) => s + p.rating, 0) / ratedPlaces.length).toFixed(1)
    : '–';

  const catCounts = visited.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

  const topRated = [...visited].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const first = [...visited].sort((a, b) => a.createdAt - b.createdAt)[0];

  const leaderboardPlaces = leaderboardCat === 'all' ? visited : visited.filter((p) => p.category === leaderboardCat);
  const leaderboardUsedCats = Array.from(new Set(visited.filter((p) => (p.menuItems ?? []).some((m) => m.rating !== undefined)).map((p) => p.category)));

  // Dish leaderboard — flatten all rated menu items across filtered places
  const dishLeaderboard = leaderboardPlaces
    .flatMap((p) =>
      (p.menuItems ?? [])
        .filter((m) => m.rating !== undefined)
        .map((m) => ({ dish: m.name, rating: m.rating as number, placeName: p.name, placeId: p.id })),
    )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);
  const latest = visited[0];
  const totalPhotos = visited.reduce((s, p) => s + p.photoUrls.length, 0);

  function handleSignOut() {
    if (confirm('This will sign you out. You can rejoin with the same code anytime.')) {
      clearCoupleCode();
      router.push('/setup');
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-12 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-brown-dark">💌 Our Story</h1>
          <p className="text-xs text-brown-light mt-1">Code: {coupleCode}</p>
        </div>

        {/* Big stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: '📍', value: visited.length, label: 'Places Visited', color: '#C4614A' },
            { emoji: '🌟', value: wishlist.length, label: 'On Wishlist', color: '#9C6FBE' },
            { emoji: '⭐', value: avgRating, label: 'Avg Rating', color: '#D4A853' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl shadow-card p-4 text-center border"
              style={{ borderColor: s.color + '33' }}
            >
              <div className="text-2xl">{s.emoji}</div>
              <div className="text-2xl font-extrabold mt-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-brown-mid mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="text-xs font-bold text-brown-mid uppercase tracking-wider mb-4">By Category</h2>
          {sortedCats.length === 0 ? (
            <p className="text-brown-light text-sm text-center">No data yet</p>
          ) : (
            <div className="space-y-3">
              {sortedCats.map(([cat, count]) => {
                const pct = visited.length > 0 ? (count / visited.length) * 100 : 0;
                const color = CAT_COLORS[cat] || '#C4614A';
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-base w-6">{CAT_ICONS[cat] || '📍'}</span>
                    <span className="text-sm text-brown-dark w-20 font-medium capitalize">{cat}</span>
                    <div className="flex-1 h-2 bg-rose-50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-sm font-bold text-brown-mid w-4 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-xs font-bold text-brown-mid uppercase tracking-wider">Milestones</h2>
          </div>
          {[
            { emoji: '🎉', label: 'First place', value: first?.name ?? '–', id: first?.id },
            { emoji: '🆕', label: 'Most recent', value: latest?.name ?? '–', id: latest?.id },
            { emoji: '🏆', label: 'Top category', value: sortedCats[0] ? `${CAT_ICONS[sortedCats[0][0]]} ${sortedCats[0][0]} (${sortedCats[0][1]})` : '–' },
            { emoji: '📸', label: 'Total photos', value: totalPhotos.toString() },
          ].map((m, i, arr) => (
            <div key={m.label} className={`flex items-center gap-3 px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-rose-50' : ''}`}>
              <span className="text-xl w-7">{m.emoji}</span>
              <span className="text-sm text-brown-mid flex-1">{m.label}</span>
              {m.id ? (
                <Link href={`/place/${m.id}`} className="text-sm font-semibold text-brown-dark hover:text-primary transition-colors max-w-[140px] truncate">
                  {m.value} ›
                </Link>
              ) : (
                <span className="text-sm font-semibold text-brown-dark max-w-[140px] truncate">{m.value}</span>
              )}
            </div>
          ))}
        </div>

        {/* Top rated */}
        {topRated.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <h2 className="text-xs font-bold text-brown-mid uppercase tracking-wider">Top Rated</h2>
            </div>
            {topRated.map((p, i) => (
              <Link
                key={p.id}
                href={`/place/${p.id}`}
                className={`flex items-center gap-3 px-5 py-3.5 hover:bg-rose-50 transition-colors ${i < topRated.length - 1 ? 'border-b border-rose-50' : ''}`}
              >
                <span className="text-xl">{['🥇', '🥈', '🥉'][i]}</span>
                <span className="text-sm text-brown-dark font-semibold flex-1 truncate">{p.name}</span>
                <StarRating value={p.rating} readonly size="sm" />
              </Link>
            ))}
          </div>
        )}

        {/* Dish leaderboard */}
        {(dishLeaderboard.length > 0 || leaderboardUsedCats.length > 0) && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <h2 className="text-xs font-bold text-brown-mid uppercase tracking-wider">🏆 Dish Leaderboard</h2>
              <p className="text-xs text-brown-light mt-0.5">Your highest-rated dishes across all restaurants</p>
              {leaderboardUsedCats.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {['all', ...leaderboardUsedCats].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setLeaderboardCat(cat)}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all ${
                        leaderboardCat === cat
                          ? 'bg-primary border-primary text-white'
                          : 'bg-white border-rose-100 text-brown-mid hover:border-rose-300'
                      }`}
                    >
                      {cat === 'all' ? '🗂 All' : `${CAT_ICONS[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {dishLeaderboard.length === 0 && (
              <p className="px-5 pb-4 text-sm text-brown-light italic">No rated dishes in this category yet</p>
            )}
            {dishLeaderboard.map((entry, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              const barPct = (entry.rating / 10) * 100;
              return (
                <Link
                  key={`${entry.placeId}-${entry.dish}-${i}`}
                  href={`/place/${entry.placeId}`}
                  className={`flex items-center gap-3 px-5 py-3.5 hover:bg-rose-50 transition-colors ${i < dishLeaderboard.length - 1 ? 'border-b border-rose-50' : ''}`}
                >
                  <span className="w-6 text-center text-lg flex-shrink-0">
                    {medal ?? <span className="text-xs font-bold text-brown-light">#{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brown-dark truncate">{entry.dish}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-rose-50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-brown-light truncate flex-shrink-0">{entry.placeName}</p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-amber-500 flex-shrink-0">{entry.rating}/10</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3.5 rounded-xl border-2 border-rose-100 text-sm font-semibold text-brown-mid hover:border-rose-300 transition-colors"
        >
          Change Couple Code
        </button>
      </div>
    </div>
  );
}
