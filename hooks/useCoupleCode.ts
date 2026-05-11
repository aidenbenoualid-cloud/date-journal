'use client';
import { useState, useEffect } from 'react';

const KEY = 'date_journal_couple_code';

export function useCoupleCode() {
  const [coupleCode, setCoupleCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCoupleCode(localStorage.getItem(KEY));
    setLoading(false);
  }, []);

  function saveCoupleCode(code: string) {
    const normalized = code.trim().toUpperCase();
    localStorage.setItem(KEY, normalized);
    setCoupleCode(normalized);
  }

  function clearCoupleCode() {
    localStorage.removeItem(KEY);
    setCoupleCode(null);
  }

  return { coupleCode, loading, saveCoupleCode, clearCoupleCode };
}
