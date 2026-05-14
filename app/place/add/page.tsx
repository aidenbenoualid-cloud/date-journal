'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCoupleCode } from '../../../hooks/useCoupleCode';
import { addPlace, uploadPhoto, geocodeAddress } from '../../../lib/places';
import CategoryPicker from '../../../components/CategoryPicker';
import StarRating from '../../../components/StarRating';
import PhotoUpload from '../../../components/PhotoUpload';
import { Category, MenuItem, PriceRange } from '../../../types';

const PRICES: { value: PriceRange; label: string }[] = [
  { value: 1, label: '$' }, { value: 2, label: '$$' },
  { value: 3, label: '$$$' }, { value: 4, label: '$$$$' },
];
const OCCASIONS = ['Date night', 'Anniversary', 'Birthday', 'Celebration', 'Casual'];

export default function AddPlacePage() {
  const { coupleCode } = useCoupleCode();
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState<Category>('restaurant');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange>(2);
  const [occasion, setOccasion] = useState('');
  const [isWishlist, setIsWishlist] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuItem, setNewMenuItem] = useState('');
  const [newMenuItemRating, setNewMenuItemRating] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [suggestions, setSuggestions] = useState<{ label: string; lat: number; lon: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resolvedGeo, setResolvedGeo] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (address.length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=5`,
        );
        const data = await res.json();
        setSuggestions(
          data.features.map((f: any) => {
            const p = f.properties;
            const parts = [
              p.name,
              p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street,
              p.city,
              p.state,
              p.country,
            ].filter(Boolean);
            return { label: parts.join(', '), lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] };
          }),
        );
        setShowSuggestions(true);
      } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [address]);

  function handleAddPhotos(files: File[]) {
    setPhotoFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => [...prev, ...previews]);
  }

  function handleRemovePhoto(i: number) {
    URL.revokeObjectURL(photoPreviews[i]);
    setPhotoFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addMenuItem() {
    const t = newMenuItem.trim();
    if (!t) return;
    const ratingVal = parseFloat(newMenuItemRating);
    const hasRating = !isNaN(ratingVal) && ratingVal >= 0 && ratingVal <= 10;
    setMenuItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: t, ...(hasRating && { rating: ratingVal }) },
    ]);
    setNewMenuItem('');
    setNewMenuItemRating('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !coupleCode) return;
    setSaving(true);

    try {
      setStatus('📍 Finding location…');
      const geo = resolvedGeo ?? await geocodeAddress(name, address);

      // Upload photos first so the URL is ready before the place is created
      const photoUrls: string[] = [];
      if (photoFiles.length > 0) {
        setStatus(`📸 Uploading ${photoFiles.length} photo${photoFiles.length > 1 ? 's' : ''}…`);
        for (const file of photoFiles) {
          photoUrls.push(await uploadPhoto(coupleCode, '', file));
        }
      }

      setStatus('💾 Saving…');
      await addPlace(coupleCode, {
        name: name.trim(),
        category,
        address: geo?.address ?? address.trim(),
        latitude: geo?.latitude ?? 0,
        longitude: geo?.longitude ?? 0,
        visitDate,
        rating: isWishlist ? 0 : rating,
        notes: notes.trim(),
        menuItems,
        photoUrls,
        priceRange,
        occasion: occasion.trim(),
        isWishlist,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      alert(err.message || 'Something went wrong saving the place.');
      setSaving(false);
      setStatus('');
      return;
    }

    window.location.replace('/journal');
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-12">
        <h1 className="text-3xl font-extrabold text-brown-dark mb-6">Add a Place</h1>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Wishlist toggle */}
          <div className="bg-purple-50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-purple-700">Want to visit (wishlist)</p>
              <p className="text-xs text-purple-500 mt-0.5">Turn off if you've already been</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isWishlist} onChange={(e) => setIsWishlist(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500" />
            </label>
          </div>

          {/* Name */}
          <Field label="Place Name *">
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Le Petit Café"
              className={inputCls}
            />
          </Field>

          {/* Address */}
          <Field label="Address or Area *" hint="We'll auto-pin it on the map">
            <div className="relative">
              <input
                ref={addressRef}
                required
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setResolvedGeo(null); }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={(e) => e.key === 'Escape' && setShowSuggestions(false)}
                placeholder="e.g. 123 Rue Saint-Denis, Montreal"
                className={inputCls}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-rose-100 shadow-lg overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setAddress(s.label);
                        setResolvedGeo({ latitude: s.lat, longitude: s.lon, address: s.label });
                        setShowSuggestions(false);
                        addressRef.current?.blur();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-brown-dark hover:bg-rose-50 border-b border-rose-50 last:border-0 truncate"
                    >
                      📍 {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          {/* Category */}
          <Field label="Category">
            <CategoryPicker value={category} onChange={setCategory} />
          </Field>

          {/* Price range */}
          <Field label="Price Range">
            <div className="flex gap-2">
              {PRICES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriceRange(p.value)}
                  className={`flex-1 py-2.5 rounded-xl font-bold border-2 transition-all ${
                    priceRange === p.value
                      ? 'bg-amber-400 border-amber-400 text-white'
                      : 'bg-white border-rose-100 text-brown-mid hover:border-rose-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Visit date + rating (not for wishlist) */}
          {!isWishlist && (
            <>
              <Field label="Visit Date">
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={inputCls}
                />
              </Field>
              <Field label="Rating">
                <StarRating value={rating} onChange={setRating} size="lg" />
              </Field>
            </>
          )}

          {/* Occasion */}
          <Field label="Occasion (optional)">
            <div className="flex flex-wrap gap-2 mb-2">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => setOccasion(occasion === occ ? '' : occ)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                    occasion === occ
                      ? 'bg-amber-400 border-amber-400 text-white'
                      : 'bg-white border-rose-100 text-brown-mid hover:border-rose-300'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="Or type a custom occasion…"
              className={inputCls}
            />
          </Field>

          {/* Menu items */}
          <Field label="What We Ordered">
            {menuItems.map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-rose-50 last:border-0">
                <span className="text-brown-dark text-sm flex-1">{m.name}</span>
                {m.rating !== undefined && (
                  <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                    {m.rating}/10
                  </span>
                )}
                <button type="button" onClick={() => setMenuItems((p) => p.filter((x) => x.id !== m.id))} className="text-brown-light hover:text-red-400 text-sm">✕</button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newMenuItem}
                onChange={(e) => setNewMenuItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMenuItem())}
                placeholder="e.g. Croque Monsieur"
                className={`${inputCls} flex-1 min-w-0`}
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
                className="w-16 bg-white border border-rose-100 rounded-xl px-3 py-2.5 text-brown-dark text-sm outline-none focus:border-primary transition-colors placeholder:text-brown-light"
              />
              <button
                type="button"
                onClick={addMenuItem}
                className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-brown-light mt-1">Rate each dish out of 10 (optional)</p>
          </Field>

          {/* Photos */}
          <Field label="Photos">
            <PhotoUpload previews={photoPreviews} onAdd={handleAddPhotos} onRemove={handleRemovePhoto} />
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was the vibe? What made it special?"
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl shadow-md hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? status || 'Saving…' : isWishlist ? '🌟 Add to Wishlist' : '💾 Save Place'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-brown-mid uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-xs text-brown-light">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full bg-white border border-rose-100 rounded-xl px-4 py-2.5 text-brown-dark text-sm outline-none focus:border-primary transition-colors placeholder:text-brown-light';
