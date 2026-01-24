import { api } from '@/lib/api';
import { Cafe, Category, Product } from '@/components/menu/templates/types';

export const MenuService = {
  getCafe: async (idOrSlug: string): Promise<Cafe> => {
    // Check if the input is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    // If it's not a UUID, assume it's a slug
    const endpoint = isUuid ? `/cafes/${idOrSlug}` : `/cafes/slug/${idOrSlug}`;
    
    const response = await api.get(endpoint);
    return response.data;
  },

  getCategories: async (cafeId: string): Promise<Category[]> => {
    const response = await api.get(`/categories?cafeId=${cafeId}`);
    return response.data;
  },

  getProducts: async (cafeId: string): Promise<Product[]> => {
    const response = await api.get(`/products?cafeId=${cafeId}`);
    return response.data.map((p: Product) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      averageRating: p.averageRating ? Number(p.averageRating) : 0,
      stock: p.stock ?? 0, // Ensure stock is defined
      image: p.imageUrl, // Map backend imageUrl to frontend image expected by CartStore
    }));
  },

  getActiveOrders: async (cafeId: string) => {
    const response = await api.get(`/orders?cafeId=${cafeId}`);
    return response.data;
  },

  getTables: async (cafeId: string) => {
    const response = await api.get(`/tables?cafeId=${cafeId}`);
    return response.data;
  }
};
