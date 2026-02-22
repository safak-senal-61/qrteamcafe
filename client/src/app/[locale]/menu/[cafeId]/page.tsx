import { API_URL } from '@/lib/api';
import MenuClient from './MenuClient';

async function getCafe(id: string) {
  try {
    const res = await fetch(`${API_URL}/cafes/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching cafe:', error);
    return null;
  }
}

async function getCategories(cafeId: string) {
  try {
    const res = await fetch(`${API_URL}/categories?cafeId=${cafeId}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

async function getProducts(cafeId: string) {
  try {
    const res = await fetch(`${API_URL}/products?cafeId=${cafeId}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    // Filter available products on server side as well
    return data.filter((p: any) => p.isAvailable);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

interface PageProps {
  params: Promise<{ cafeId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { cafeId } = await params;
  const resolvedSearchParams = await searchParams;
  const table = resolvedSearchParams.table;
  const demo = resolvedSearchParams.demo;

  const cafeData = await getCafe(cafeId);
  const categoriesData = await getCategories(cafeId);
  const productsData = await getProducts(cafeId);

  const tableNumber = typeof table === 'string' ? table : null;
  const isDemo = demo === 'true';

  return (
    <MenuClient 
      cafeId={cafeId} 
      tableNumber={tableNumber}
      initialCafe={cafeData}
      initialCategories={categoriesData}
      initialProducts={productsData}
      isDemo={isDemo}
    />
  );
}