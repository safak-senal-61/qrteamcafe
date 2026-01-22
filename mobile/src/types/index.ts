export interface Cafe {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  coverImageUrl?: string;
  // Add other fields as needed
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isAvailable: boolean;
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}
