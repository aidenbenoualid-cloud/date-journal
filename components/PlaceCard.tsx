'use client';
import Link from 'next/link';
import { Place } from '../types';
import StarRating from './StarRating';

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
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PlaceCard({ place }: { place: Place }) {
  const color = CAT_COLORS[place.category];
  return (
    <Link href={`/place/${place.id}`} className="block">
      <div className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-md transition-shadow group">
        {place.photoUrls[0] && (
          <div className="relative h-44 overflow-hidden">
            <img
              src={place.photoUrls[0]}
              alt={place.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {place.isWishlist && (
              <span className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                ✨ Want to visit
              </span>
            )}
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color, backgroundColor: color + '20' }}
            >
              {CAT_ICONS[place.category]} {place.category.charAt(0).toUpperCase() + place.category.slice(1)}
            </span>
            <span className="text-sm font-bold text-amber-500">{PRICE[place.priceRange]}</span>
          </div>
          <h3 className="text-lg font-extrabold text-brown-dark truncate">{place.name}</h3>
          <p className="text-xs text-brown-light truncate mt-0.5">{place.address}</p>
          {!place.isWishlist && (
            <div className="flex items-center justify-between mt-2">
              <StarRating value={place.rating} readonly size="sm" />
              <span className="text-xs text-brown-light">{fmtDate(place.visitDate)}</span>
            </div>
          )}
          {place.occasion && (
            <p className="text-xs text-amber-600 font-medium mt-1">🎉 {place.occasion}</p>
          )}
          {place.menuItems.length > 0 && (
            <p className="text-xs text-brown-mid italic mt-1 truncate">
              {place.menuItems[0].name}
              {place.menuItems[0].rating !== undefined && (
                <span className="not-italic font-bold text-amber-500 ml-1">{place.menuItems[0].rating}/10</span>
              )}
              {place.menuItems.length > 1 ? ` +${place.menuItems.length - 1} more` : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
