export type Category = 'restaurant' | 'coffee' | 'bakery' | 'bar' | 'dessert' | 'brunch' | 'other';
export type PriceRange = 1 | 2 | 3 | 4;

export interface MenuItem {
  id: string;
  name: string;
  notes?: string;
  rating?: number;
}

export interface Place {
  id: string;
  name: string;
  category: Category;
  address: string;
  latitude: number;
  longitude: number;
  visitDate: string;
  rating: number;
  notes: string;
  menuItems: MenuItem[];
  photoUrls: string[];
  priceRange: PriceRange;
  occasion: string;
  isWishlist: boolean;
  isFavorite?: boolean;
  createdAt: number;
  updatedAt: number;
}
