'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCoupleCode } from '../hooks/useCoupleCode';

export default function Home() {
  const { coupleCode, loading } = useCoupleCode();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(coupleCode ? '/map' : '/setup');
  }, [coupleCode, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-cream">
      <div className="text-4xl animate-pulse">💕</div>
    </div>
  );
}
