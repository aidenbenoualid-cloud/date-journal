'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCoupleCode } from '../../../hooks/useCoupleCode';
import { usePlaces } from '../../../hooks/usePlaces';
import { updatePlace, deletePlace, uploadPhoto } from '../../../lib/places';
import StarRating from '../../../components/StarRating';
import PhotoUpload from '../../../components/PhotoUpload';
import { Category, MenuItem } from '../../../types';

const ALL_CATEGORIES: Category[] = ['restaurant', 'coffee', 'bakery', 'bar', 'dessert', 'brunch', 'other'];

const CAT_COLORS: Record<string, string> = {
  restaurant: '#C4614A', coffee: '#8B5E3C', bakery: '#D4A853',
  bar: '#5E6FA8', dessert: '#C4618A', brunch: '#6A9E6A', other: '#8B7E72',
};
const CAT_ICONS: Record<string, string> = {
  restaurant: '🍽️', coffee: '☕', bakery: '🥐',
  bar: '🍸', dessert: '🍰', brunch: '🥞', other: '📍',
};
const PRICE = ['', '$', '$$', '$$$', '$$$$'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { coupleCode } = useCoupleCode();
  const { places } = usePlaces(coupleCode);
  const router = useRouter();

  const place = places.find((p) => p.id === id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuItem, setNewMenuItem] = useState('');
  const [newMenuItemRating, setNewMenuItemRating] = useState<string>('');
  const [newMenuItemCategory, setNewMenuItemCategory] = useState<Category>('' as Category);
  const [remoteUrls, setRemoteUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editIsWishlist, setEditIsWishlist] = useState(false);
  const [editVisitDate, setEditVisitDate] = useState('');

  useEffect(() => {
    if (place) {
      setRating(place.rating);
      setNotes(place.notes);
      setMenuItems(place.menuItems);
      setRemoteUrls(place.photoUrls);
      setEditIsWishlist(place.isWishlist);
      setEditVisitDate(place.visitDate);
      setNewMenuItemCategory(place.category);
    }
  }, [place]);

  if (!place) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-4xl animate-pulse">⏳</div>
      </div>
    );
  }

  const color = CAT_COLORS[place.category];
  const allPreviews = [...remoteUrls, ...newPreviews];

  async function handleSave() {
    if (!coupleCode || !place) return;
    setSaving(true);
    try {
      const uploaded: string[] = [];
      for (const file of newFiles) {
        uploaded.push(await uploadPhoto(coupleCode, place.id, file));
      }
      await updatePlace(coupleCode, place.id, {
        rating: editIsWishlist ? 0 : rating,
        notes,
        menuItems,
        photoUrls: [...remoteUrls, ...uploaded],
        isWishlist: editIsWishlist,
        visitDate: editVisitDate,
      });
      setNewFiles([]);
      setNewPreviews([]);
      setEditing(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddPhotos(files: File[]) {
    setNewFiles((p) => [...p, ...files]);
    setNewPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  }

  function handleRemovePhoto(i: number) {
    if (i < remoteUrls.length) {
      setRemoteUrls((p) => p.filter((_, idx) => idx !== i));
    } else {
      const pi = i - remoteUrls.length;
      URL.revokeObjectURL(newPreviews[pi]);
      setNewFiles((p) => p.filter((_, idx) => idx !== pi));
      setNewPreviews((p) => p.filter((_, idx) => idx !== pi));
    }
  }

  function addMenuItem() {
    const t = newMenuItem.trim();
    if (!t) return;
    const ratingVal = parseFloat(newMenuItemRating);
    const hasRating = !isNaN(ratingVal) && ratingVal >= 0 && ratingVal <= 10;
    setMenuItems((p) => [
      ...p,
      { id: Date.now().toString(), name: t, ...(hasRating && { rating: ratingVal }), category: newMenuItemCategory || place?.category },
    ]);
    setNewMenuItem('');
    setNewMenuItemRating('');
    setNewMenuItemCategory(place?.category ?? '' as Category);
  }

  async function handleShare() {
    if (!place) return;
    const catIcon = CAT_ICONS[place.category];
    const priceStr = ['', '$', '$$', '$$$', '$$$$'][place.priceRange];
    const stars = place.rating > 0 ? '⭐'.repeat(place.rating) : null;

    const lines: string[] = [
      `${catIcon} ${place.name}`,
      `${place.category.charAt(0).toUpperCase() + place.category.slice(1)} · ${priceStr}`,
      `📍 ${place.address}`,
      !place.isWishlist && stars ? `${stars} (${place.rating}/5)` : '',
      !place.isWishlist ? `📅 ${fmtDate(place.visitDate)}` : '✨ On our wishlist',
      place.menuItems.length > 0
        ? `\nWhat we ordered:\n${place.menuItems.map((m) => `• ${m.name}${m.rating !== undefined ? ` — ${m.rating}/10` : ''}`).join('\n')}`
        : '',
      `\nTry the date journal for yourself: ${window.location.origin}`,
    ].filter(Boolean);

    const text = lines.join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: place.name, text });
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  }

  async function confirmDelete() {
    if (!place) return;
    if (confirm(`Remove "${place.name}" from your journal?`)) {
      await deletePlace(coupleCode!, place.id);
      window.location.replace('/journal');
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none"
            onClick={() => setLightboxIndex(null)}
          >
            ✕
          </button>
          {place.photoUrls.length > 1 && (
            <button
              className="absolute left-4 text-white text-3xl px-2"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + place.photoUrls.length) % place.photoUrls.length); }}
            >
              ‹
            </button>
          )}
          <img
            src={place.photoUrls[lightboxIndex]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {place.photoUrls.length > 1 && (
            <button
              className="absolute right-4 text-white text-3xl px-2"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % place.photoUrls.length); }}
            >
              ›
            </button>
          )}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Link href="/journal" className="text-sm font-semibold text-brown-mid hover:text-primary flex items-center gap-1">
            ← Back
          </Link>
          <div className="flex items-center gap-3">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="text-sm text-brown-mid font-semibold">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm font-bold text-white bg-primary px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  {saving ? '…' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => coupleCode && updatePlace(coupleCode, place.id, { isFavorite: !place.isFavorite })}
                  className="text-2xl leading-none transition-transform active:scale-125"
                  aria-label={place.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {place.isFavorite ? '★' : '☆'}
                </button>
                <button onClick={handleShare} className="text-sm font-bold text-brown-mid hover:text-primary">Share</button>
                <button onClick={() => setEditing(true)} className="text-sm font-bold text-primary hover:underline">Edit</button>
                <button onClick={confirmDelete} className="text-sm font-semibold text-red-400 hover:underline">Delete</button>
              </>
            )}
          </div>
        </div>

        {/* Title block */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color, backgroundColor: color + '20' }}>
              {CAT_ICONS[place.category]} {place.category.charAt(0).toUpperCase() + place.category.slice(1)}
            </span>
            <span className="text-sm font-bold text-amber-500">{PRICE[place.priceRange]}</span>
            {place.isWishlist && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-600">✨ Wishlist</span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-brown-dark">{place.name}</h1>
          <p className="text-sm text-brown-light mt-1">{place.address}</p>
          {!place.isWishlist && <p className="text-sm text-brown-mid mt-1">📅 {fmtDate(place.visitDate)}</p>}
          {place.occasion && <p className="text-sm text-amber-600 font-medium mt-1">🎉 {place.occasion}</p>}
        </div>

        {/* Wishlist → journal conversion (edit mode only) */}
        {editing && place.isWishlist && (
          <div className={`rounded-2xl p-4 flex items-center justify-between ${editIsWishlist ? 'bg-purple-50' : 'bg-green-50'}`}>
            <div>
              <p className={`font-semibold text-sm ${editIsWishlist ? 'text-purple-700' : 'text-green-700'}`}>
                {editIsWishlist ? '✨ On your wishlist' : '✅ Mark as visited'}
              </p>
              <p className={`text-xs mt-0.5 ${editIsWishlist ? 'text-purple-500' : 'text-green-600'}`}>
                {editIsWishlist ? 'Toggle to move this to your journal' : 'This will be saved as a journal entry'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!editIsWishlist}
                onChange={(e) => {
                  setEditIsWishlist(!e.target.checked);
                  if (e.target.checked && !editVisitDate) {
                    setEditVisitDate(new Date().toISOString().split('T')[0]);
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
            </label>
          </div>
        )}

        {/* Rating */}
        {(!place.isWishlist || (editing && !editIsWishlist)) && (
          <Section title={editing && !editIsWishlist && place.isWishlist ? 'Visit Date & Rating' : 'Rating'}>
            {editing && !editIsWishlist && place.isWishlist && (
              <input
                type="date"
                value={editVisitDate}
                onChange={(e) => setEditVisitDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-white border border-rose-100 rounded-xl px-4 py-2.5 text-brown-dark text-sm outline-none focus:border-primary transition-colors mb-2"
              />
            )}
            <StarRating value={rating} onChange={editing ? setRating : undefined} size="lg" readonly={!editing} />
          </Section>
        )}

        {/* Photos */}
        <Section title="Photos">
          {editing ? (
            <PhotoUpload previews={allPreviews} onAdd={handleAddPhotos} onRemove={handleRemovePhoto} />
          ) : place.photoUrls.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {place.photoUrls.map((url, i) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  onClick={() => setLightboxIndex(i)}
                  className="w-32 h-32 rounded-xl object-cover flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                />
              ))}
            </div>
          ) : (
            <p className="text-brown-light text-sm italic">No photos yet</p>
          )}
        </Section>

        {/* Menu items */}
        <Section title="What We Ordered">
          {menuItems.length === 0 && !editing && (
            <p className="text-brown-light text-sm italic">Nothing logged yet</p>
          )}
          {menuItems.map((m) => (
            <div key={m.id} className="flex items-center gap-2 py-2 border-b border-rose-50 last:border-0">
              {m.category && m.category !== place.category && (
                <span className="text-sm flex-shrink-0">{CAT_ICONS[m.category]}</span>
              )}
              <span className="text-sm text-brown-dark flex-1">{m.name}</span>
              {m.rating !== undefined && (
                <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                  {m.rating}/10
                </span>
              )}
              {editing && (
                <button onClick={() => setMenuItems((p) => p.filter((x) => x.id !== m.id))} className="text-brown-light hover:text-red-400 text-sm flex-shrink-0">✕</button>
              )}
            </div>
          ))}
          {editing && (
            <div className="flex gap-2 mt-2 flex-wrap">
              <input
                type="text"
                value={newMenuItem}
                onChange={(e) => setNewMenuItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMenuItem())}
                placeholder="Dish name…"
                className="flex-1 min-w-0 bg-white border border-rose-100 rounded-xl px-4 py-2 text-sm text-brown-dark outline-none focus:border-primary"
              />
              <input
                type="number"
                value={newMenuItemRating}
                onChange={(e) => setNewMenuItemRating(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMenuItem())}
                placeholder="Score"
                min="0"
                max="10"
                step="0.001"
                className="w-16 bg-white border border-rose-100 rounded-xl px-3 py-2 text-sm text-brown-dark outline-none focus:border-primary"
              />
              <button onClick={addMenuItem} className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm">Add</button>
            </div>
          )}
          {editing && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewMenuItemCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    newMenuItemCategory === cat
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white border-rose-100 text-brown-mid hover:border-rose-300'
                  }`}
                >
                  {CAT_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          )}
          {editing && <p className="text-xs text-brown-light mt-1">Score out of 10 (optional) · Tag its category for the leaderboard</p>}
        </Section>

        {/* Notes */}
        <Section title="Notes">
          {editing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was it?"
              rows={4}
              className="w-full bg-white border border-rose-100 rounded-xl px-4 py-2.5 text-sm text-brown-dark outline-none focus:border-primary resize-none"
            />
          ) : notes ? (
            <div className="bg-white rounded-xl border border-rose-100 p-4">
              <p className="text-sm text-brown-dark leading-relaxed whitespace-pre-wrap">{notes}</p>
            </div>
          ) : (
            <p className="text-brown-light text-sm italic">No notes added</p>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-bold text-brown-mid uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}
