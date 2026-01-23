import { api } from './api';
import { Cafe, Category, Product } from '../types';

// Helper functions for sorting logic (Client'tan alındı)
const getPriorityKeywords = (currentHour: number) => {
  if (currentHour >= 5 && currentHour < 12) {
    return ['kahvaltı', 'börek', 'poğaça', 'simit', 'tost', 'yumurta', 'menemen', 'çay', 'sıcak içecek'];
  } else if (currentHour >= 12 && currentHour < 17) {
    return ['döner', 'burger', 'pide', 'lahmacun', 'kebap', 'ana yemek', 'pizza', 'salata', 'makarna', 'çorba'];
  } else if (currentHour >= 17 && currentHour < 22) {
    return ['ana yemek', 'ızgara', 'balık', 'steak', 'makarna', 'pizza', 'kebap', 'başlangıç'];
  } else {
    return ['çorba', 'kokoreç', 'sokak', 'tatlı', 'atıştırmalık', 'içecek', 'kahve'];
  }
};

export const sortCategoriesByTime = (categories: Category[]) => {
  const now = new Date();
  const currentHour = now.getHours();
  const priorityKeywords = getPriorityKeywords(currentHour);

  const isPriority = (name: string) => {
    const lowerName = name.toLowerCase();
    return priorityKeywords.some(keyword => lowerName.includes(keyword));
  };

  const priorityCats: Category[] = [];
  const otherCats: Category[] = [];

  categories.forEach(cat => {
    if (isPriority(cat.name)) {
      priorityCats.push(cat);
    } else {
      otherCats.push(cat);
    }
  });

  return [...priorityCats, ...otherCats];
};

export const getCafeBySlug = async (slug: string): Promise<Cafe> => {
  try {
    const response = await api.get(`/cafes/slug/${slug}`);
    return response.data;
  } catch (error) {
    console.log('API Error (getCafeBySlug):', error);
    throw error;
  }
};

export const getCafeById = async (id: string): Promise<Cafe> => {
  try {
    const response = await api.get(`/cafes/${id}`);
    return response.data;
  } catch (error) {
    console.log('API Error (getCafeById):', error);
    throw error;
  }
};

export const getCafeCategories = async (cafeId: string): Promise<Category[]> => {
  try {
    // 1. Kategorileri çek
    const catRes = await api.get(`/categories?cafeId=${cafeId}`);
    const categories: Category[] = catRes.data;

    // 2. Ürünleri çek
    const prodRes = await api.get(`/products?cafeId=${cafeId}`);
    const products: Product[] = prodRes.data.filter((p: Product) => p.isAvailable);

    // 3. Ürünleri kategorilere dağıt
    const categoriesWithProducts = categories.map(cat => ({
      ...cat,
      products: products.filter(p => p.categoryId === cat.id)
    })).filter(cat => cat.products.length > 0); // Boş kategorileri gizle

    // 4. Zaman bazlı sırala
    return sortCategoriesByTime(categoriesWithProducts);
  } catch (error) {
    console.log('API Error (getCafeCategories):', error);
    throw error;
  }
};

export const getCafeProducts = async (cafeId: string): Promise<Product[]> => {
  try {
    const response = await api.get(`/products?cafeId=${cafeId}`);
    return response.data.filter((p: Product) => p.isAvailable);
  } catch (error) {
    console.log('API Error (getCafeProducts):', error);
    return [];
  }
};
