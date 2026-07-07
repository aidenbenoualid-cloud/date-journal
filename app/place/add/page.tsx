'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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
const CATEGORIES: Category[] = ['restaurant', 'coffee', 'bakery', 'bar', 'dessert', 'brunch', 'other'];
const CAT_ICONS: Record<string, string> = {
  restaurant: '🍽️', coffee: '☕', bakery: '🥐',
  bar: '🍸', dessert: '🍰', brunch: '🥞', other: '📍',
};

type Mode = 'picker' | 'voice' | 'video' | 'processing' | 'form';

export default function AddPlacePage() {
  const { coupleCode } = useCoupleCode();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('picker');
  const [aiTranscript, setAiTranscript] = useState('');
  const [aiError, setAiError] = useState('');
  const [processingMsg, setProcessingMsg] = useState('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const speechRecRef = useRef<any>(null);

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [videoProcessing, setVideoProcessing] = useState(false);
  const [videoProgress, setVideoProgress] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Form state
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
  const [newMenuItemCategory, setNewMenuItemCategory] = useState<Category>('restaurant');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [suggestions, setSuggestions] = useState<{ label: string; lat: number; lon: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resolvedGeo, setResolvedGeo] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
    );
  }, []);

  useEffect(() => {
    if (address.length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const locationBias = userLocation ? `&bias=proximity:${userLocation.lon},${userLocation.lat}` : '';
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(address)}&limit=5&apiKey=1a55e66d967e4215a1fe6e70b9ab046b${locationBias}`,
        );
        const data = await res.json();
        setSuggestions(
          data.features.map((f: any) => ({
            label: f.properties.formatted,
            lat: f.properties.lat,
            lon: f.properties.lon,
          })),
        );
        setShowSuggestions(true);
      } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [address]);

  // ── AI helpers ──────────────────────────────────────────────────────────────

  function prefillForm(data: any) {
    if (data.name) setName(data.name);
    if (data.address) setAddress(data.address);
    if (data.category && CATEGORIES.includes(data.category)) setCategory(data.category);
    if (data.rating && data.rating > 0) setRating(Math.min(5, Math.max(0, data.rating)));
    if (data.priceRange) setPriceRange(Math.min(4, Math.max(1, data.priceRange)) as PriceRange);
    if (data.notes) setNotes(data.notes);
    if (data.occasion) setOccasion(data.occasion);
    if (Array.isArray(data.menuItems) && data.menuItems.length > 0) {
      setMenuItems(
        data.menuItems.map((m: any, i: number) => ({
          id: Date.now().toString() + i,
          name: (m.name ?? '').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          ...(m.rating !== undefined && m.rating !== null && { rating: m.rating }),
          category: data.category && CATEGORIES.includes(data.category) ? data.category : 'restaurant',
        })).filter((m: MenuItem) => m.name),
      );
    }
  }

  async function sendToAI(audioBlob?: Blob, transcript?: string) {
    setMode('processing');
    setProcessingMsg(audioBlob ? '🎙️ Transcribing your review…' : '✨ Reading your review…');

    try {
      let body: FormData | string;
      let headers: Record<string, string> = {};

      if (audioBlob) {
        const fd = new FormData();
        fd.append('audio', audioBlob, 'recording.webm');
        if (transcript) fd.append('transcript', transcript);
        body = fd;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ transcript });
      }

      setProcessingMsg('✨ Filling in your journal entry…');
      const res = await fetch('/api/ai-entry', { method: 'POST', headers, body });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'AI processing failed');

      setAiTranscript(data.transcript ?? transcript ?? '');
      prefillForm(data);
      setMode('form');
    } catch (err: any) {
      setAiError(err.message ?? 'Something went wrong. Try again or fill it in manually.');
      setMode('picker');
    }
  }

  // ── Voice recording ──────────────────────────────────────────────────────────

  async function startRecording() {
    setLiveTranscript('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(250);
      setIsRecording(true);

      // Web Speech API for live transcript display
      const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        let final = '';
        rec.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
            else interim += event.results[i][0].transcript;
          }
          setLiveTranscript(final + interim);
        };
        rec.start();
        speechRecRef.current = rec;
      }
    } catch {
      alert('Microphone access is required for voice entry.');
    }
  }

  function stopRecording() {
    setIsRecording(false);
    speechRecRef.current?.stop();
    speechRecRef.current = null;

    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());

    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      sendToAI(blob, liveTranscript);
    };
  }

  // ── Video processing ─────────────────────────────────────────────────────────

  function handleVideoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  }

  async function processVideo() {
    if (!videoFile) return;
    setVideoProcessing(true);
    setVideoProgress('Loading video…');

    try {
      const audioBlob = await extractAudioFromVideo(videoFile, setVideoProgress);
      await sendToAI(audioBlob);
    } catch (err: any) {
      alert(err.message ?? 'Could not process video. Try again.');
      setVideoProcessing(false);
      setVideoProgress('');
    }
  }

  // ── Form helpers ─────────────────────────────────────────────────────────────

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
      { id: Date.now().toString(), name: t, ...(hasRating && { rating: ratingVal }), category: newMenuItemCategory },
    ]);
    setNewMenuItem('');
    setNewMenuItemRating('');
    setNewMenuItemCategory(category);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !coupleCode) return;
    setSaving(true);

    try {
      setStatus('📍 Finding location…');
      const geo = resolvedGeo ?? await geocodeAddress(name, address);

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

  // ── Render ───────────────────────────────────────────────────────────────────

  if (mode === 'picker') {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold text-brown-dark mb-2">Add a Place</h1>
          <p className="text-sm text-brown-light mb-8">How would you like to add this entry?</p>

          {aiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
              {aiError}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => { setAiError(''); setMode('form'); }}
              className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl shadow-card border-2 border-rose-100 hover:border-primary transition-all text-left"
            >
              <span className="text-3xl">📝</span>
              <div>
                <p className="font-bold text-brown-dark">Type it in manually</p>
                <p className="text-xs text-brown-light mt-0.5">Fill in the form yourself</p>
              </div>
            </button>

            <button
              onClick={() => { setAiError(''); setMode('voice'); }}
              className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl shadow-card border-2 border-rose-100 hover:border-primary transition-all text-left"
            >
              <span className="text-3xl">🎤</span>
              <div>
                <p className="font-bold text-brown-dark">Speak your review</p>
                <p className="text-xs text-brown-light mt-0.5">Talk about the place — AI fills in the form</p>
              </div>
            </button>

            <button
              onClick={() => { setAiError(''); setMode('video'); }}
              className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl shadow-card border-2 border-rose-100 hover:border-primary transition-all text-left"
            >
              <span className="text-3xl">📹</span>
              <div>
                <p className="font-bold text-brown-dark">Upload a video review</p>
                <p className="text-xs text-brown-light mt-0.5">AI listens to your whole video and fills in the form</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'voice') {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <button onClick={() => { setMode('picker'); setIsRecording(false); speechRecRef.current?.stop(); mediaRecorderRef.current?.stop(); }} className="text-sm text-brown-light mb-6 flex items-center gap-1 hover:text-brown-dark">
            ← Back
          </button>
          <h1 className="text-2xl font-extrabold text-brown-dark mb-2">Speak your review</h1>
          <p className="text-sm text-brown-light mb-8">Tell us about the place — name, what you ordered, how it was. AI will fill everything in.</p>

          <div className="flex flex-col items-center gap-6">
            {/* Record button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-primary hover:bg-primary-dark'
              }`}
            >
              {isRecording ? '⏹' : '🎤'}
            </button>
            <p className="text-sm font-semibold text-brown-mid">
              {isRecording ? 'Tap to stop' : 'Tap to start recording'}
            </p>

            {/* Live transcript */}
            {liveTranscript && (
              <div className="w-full bg-white rounded-2xl p-4 shadow-card border border-rose-100 max-h-40 overflow-y-auto">
                <p className="text-xs font-bold text-brown-mid uppercase tracking-wider mb-2">Hearing…</p>
                <p className="text-sm text-brown-dark leading-relaxed">{liveTranscript}</p>
              </div>
            )}

            {!isRecording && !liveTranscript && (
              <p className="text-xs text-brown-light text-center max-w-xs">
                Example: "We went to Bartaco on Crescent Street. I had the fish tacos — incredible, 9 out of 10. We'd give the restaurant 4 stars overall."
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'video') {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <button onClick={() => { if (!videoProcessing) { setMode('picker'); setVideoFile(null); if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(''); } }} className="text-sm text-brown-light mb-6 flex items-center gap-1 hover:text-brown-dark">
            ← Back
          </button>
          <h1 className="text-2xl font-extrabold text-brown-dark mb-2">Upload a video review</h1>
          <p className="text-sm text-brown-light mb-8">Record yourself talking about the restaurant. AI listens to everything you say.</p>

          <div className="space-y-4">
            {!videoFile ? (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full h-48 rounded-2xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center gap-3 text-brown-light hover:border-primary hover:text-primary transition-colors bg-white"
              >
                <span className="text-4xl">📹</span>
                <span className="text-sm font-medium">Tap to choose a video</span>
                <span className="text-xs text-brown-light">From your camera roll or record a new one</span>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <video
                  src={videoPreviewUrl}
                  className="w-full max-h-56 object-contain"
                  controls
                />
              </div>
            )}

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              capture="user"
              className="hidden"
              onChange={handleVideoSelected}
            />

            {videoFile && !videoProcessing && (
              <div className="flex gap-3">
                <button
                  onClick={() => { setVideoFile(null); URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(''); }}
                  className="flex-1 py-3 rounded-xl border-2 border-rose-100 text-sm font-semibold text-brown-mid hover:border-rose-300 transition-colors"
                >
                  Change video
                </button>
                <button
                  onClick={processVideo}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors"
                >
                  ✨ Process video
                </button>
              </div>
            )}

            {videoProcessing && (
              <div className="text-center py-4">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold text-brown-dark">{videoProgress || 'Processing…'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'processing') {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
          <p className="text-lg font-bold text-brown-dark">{processingMsg}</p>
          <p className="text-sm text-brown-light mt-2">This only takes a few seconds</p>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setMode('picker')} className="text-sm text-brown-light hover:text-brown-dark">← Back</button>
          <h1 className="text-3xl font-extrabold text-brown-dark">Add a Place</h1>
        </div>

        {/* AI prefill notice */}
        {aiTranscript && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">✨ AI autofilled from your review</p>
            <p className="text-xs text-amber-600 leading-relaxed line-clamp-3">{aiTranscript}</p>
            <p className="text-xs text-amber-500 mt-1">Review everything below and make any changes before saving.</p>
          </div>
        )}

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

          <Field label="Category">
            <CategoryPicker value={category} onChange={setCategory} />
          </Field>

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

          <Field label="What We Ordered">
            {menuItems.map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-rose-50 last:border-0">
                {m.category && m.category !== category && (
                  <span className="text-sm flex-shrink-0">{CAT_ICONS[m.category]}</span>
                )}
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
            <div className="flex gap-1.5 flex-wrap mt-2">
              {CATEGORIES.map((cat) => (
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
            <p className="text-xs text-brown-light mt-1">Rate each dish out of 10 (optional) · Tag its category for the leaderboard</p>
          </Field>

          <Field label="Photos">
            <PhotoUpload previews={photoPreviews} onAdd={handleAddPhotos} onRemove={handleRemovePhoto} />
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was the vibe? What made it special?"
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </Field>

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

// ── Audio extraction from video ────────────────────────────────────────────────

async function extractAudioFromVideo(
  videoFile: File,
  onProgress: (msg: string) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const videoEl = document.createElement('video');
    videoEl.src = URL.createObjectURL(videoFile);
    videoEl.volume = 0; // silent playback — audio is routed internally

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(videoEl);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);

    const recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = () => {
      audioCtx.close();
      URL.revokeObjectURL(videoEl.src);
      resolve(new Blob(chunks, { type: 'audio/webm' }));
    };

    videoEl.onloadedmetadata = () => {
      const duration = Math.round(videoEl.duration);
      onProgress(`Listening to your ${duration}s video…`);
      recorder.start(500);
      videoEl.play().catch(reject);
    };

    videoEl.onended = () => {
      recorder.stop();
      onProgress('Sending to AI…');
    };

    videoEl.onerror = () => reject(new Error('Could not load the video file.'));

    videoEl.load();
  });
}

// ── Shared components ──────────────────────────────────────────────────────────

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
