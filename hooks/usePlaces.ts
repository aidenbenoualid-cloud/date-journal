'use client';
import { useState, useEffect } from 'react';
import { subscribePlaces } from '../lib/places';
import { Place } from '../types';

export function usePlaces(coupleCode: string | null) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleCode) {
      setPlaces([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribePlaces(coupleCode, (data) => {
      setPlaces(data);
      setLoading(false);
    });
    return unsub;
  }, [coupleCode]);

  return {
    places,
    visited: places.filter((p) => !p.isWishlist),
    wishlist: places.filter((p) => p.isWishlist),
    loading,
  };
}
