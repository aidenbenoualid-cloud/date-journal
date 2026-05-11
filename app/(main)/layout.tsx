'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCoupleCode } from '../../hooks/useCoupleCode';
import Nav from '../../components/Nav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { coupleCode, loading } = useCoupleCode();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !coupleCode) router.replace('/setup');
  }, [coupleCode, loading, router]);

  if (loading || !coupleCode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-4xl animate-pulse">💕</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-20 md:pb-0 md:pl-56">{children}</main>
      <Nav />
    </div>
  );
}
