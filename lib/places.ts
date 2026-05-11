import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
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

export async function addPlace(coupleCode: string, place: Omit<Place, 'id'>): Promise<string> {
  const ref = await addDoc(placesCol(coupleCode), place);
  return ref.id;
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
  await deleteDoc(doc(db, 'couples', coupleCode, 'places', id));
}

export async function uploadPhoto(
  coupleCode: string,
  placeId: string,
  file: File,
): Promise<string> {
  const filename = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `couples/${coupleCode}/${placeId}/${filename}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function deletePhoto(url: string): Promise<void> {
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // already gone
  }
}

async function nominatim(query: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
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
