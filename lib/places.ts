import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Place } from '../types';

function placesCol(coupleCode: string) {
  return collection(db, 'couples', coupleCode, 'places');
}

export function subscribePlaces(
  coupleCode: string,
  onData: (places: Place[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(placesCol(coupleCode), orderBy('visitDate', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Place))),
    onError,
  );
}

// Waits up to 800ms for the local cache write, then moves on regardless
// of whether the server has acknowledged. Prevents indefinite hangs.
export async function addPlace(coupleCode: string, place: Omit<Place, 'id'>): Promise<string> {
  const newRef = doc(placesCol(coupleCode));
  await Promise.race([
    setDoc(newRef, place),
    new Promise<void>((resolve) => setTimeout(resolve, 800)),
  ]);
  return newRef.id;
}

export async function updatePlace(
  coupleCode: string,
  id: string,
  updates: Partial<Omit<Place, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, 'couples', coupleCode, 'places', id), {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deletePlace(coupleCode: string, id: string): Promise<void> {
  await Promise.race([
    deleteDoc(doc(db, 'couples', coupleCode, 'places', id)),
    new Promise<void>((resolve) => setTimeout(resolve, 800)),
  ]);
}

export async function uploadPhoto(
  _coupleCode: string,
  _placeId: string,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'date journal');

  const res = await fetch(
    'https://api.cloudinary.com/v1_1/dp6cqa1ne/image/upload',
    { method: 'POST', body: formData },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? 'Photo upload failed');
  }
  const data = await res.json();
  return data.secure_url as string;
}

// Cloudinary deletion requires a server-side API secret; photos are kept in cloud storage.
export async function deletePhoto(_url: string): Promise<void> {}

async function nominatim(query: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { signal: controller.signal },
    );
    const data = await res.json();
    if (!data.length) return null;
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      address: data[0].display_name as string,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function geocodeAddress(
  name: string,
  address: string,
): Promise<{ latitude: number; longitude: number; address: string } | null> {
  // Try name + address first, then address alone as fallback
  // Each attempt times out after 5s so the save never hangs
  return (await nominatim(`${name} ${address}`)) ?? (await nominatim(address));
}
