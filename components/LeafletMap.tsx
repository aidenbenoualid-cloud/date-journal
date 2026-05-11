'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { Place } from '../types';

// Fix Leaflet's default icon paths being broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CAT_COLORS: Record<string, string> = {
  restaurant: '#C4614A', coffee: '#8B5E3C', bakery: '#D4A853',
  bar: '#5E6FA8', dessert: '#C4618A', brunch: '#6A9E6A', other: '#8B7E72',
};
const CAT_ICONS: Record<string, string> = {
  restaurant: '🍽️', coffee: '☕', bakery: '🥐',
  bar: '🍸', dessert: '🍰', brunch: '🥞', other: '📍',
};

function makeIcon(category: string) {
  const color = CAT_COLORS[category] || '#C4614A';
  const emoji = CAT_ICONS[category] || '📍';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};border:2.5px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.25);
    ">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();
  useEffect(() => {
    if (!places.length) return;
    const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [places, map]);
  return null;
}

interface Props {
  places: Place[];
  className?: string;
}

export default function LeafletMap({ places, className = '' }: Props) {
  return (
    <MapContainer
      center={[45.5, -73.57]}
      zoom={12}
      className={`w-full h-full z-0 ${className}`}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds places={places.filter((p) => p.latitude !== 0 || p.longitude !== 0)} />
      {places.map((place) =>
        place.latitude !== 0 || place.longitude !== 0 ? (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={makeIcon(place.category)}
          >
            <Popup closeButton={false}>
              <div className="text-center min-w-[140px]">
                <p className="font-bold text-brown-dark text-sm">{place.name}</p>
                <p className="text-xs text-brown-light mt-0.5 line-clamp-1">{place.address}</p>
                <Link
                  href={`/place/${place.id}`}
                  className="mt-2 inline-block text-xs font-bold text-primary hover:underline"
                >
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ) : null,
      )}
    </MapContainer>
  );
}
