'use client';
import { useCoupleCode } from '../../../hooks/useCoupleCode';
import { usePlaces } from '../../../hooks/usePlaces';
import PlaceCard from '../../../components/PlaceCard';

export default function WishlistPage() {
  const { coupleCode } = useCoupleCode();
  const { wishlist, loading } = usePlaces(coupleCode);

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-8">
        <h1 className="text-3xl font-extrabold text-brown-dark">🌟 Wishlist</h1>
        <p className="text-brown-mid text-sm mt-1">Places you want to try together</p>

        {loading ? (
          <div className="flex justify-center mt-12">
            <div className="text-3xl animate-pulse">🌟</div>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 gap-3 text-center">
            <div className="text-5xl">🌟</div>
            <p className="text-lg font-bold text-brown-dark">Nothing on your wishlist yet</p>
            <p className="text-sm text-brown-mid">When adding a place, toggle "Want to visit" to save it here.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wishlist.map((p) => <PlaceCard key={p.id} place={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
