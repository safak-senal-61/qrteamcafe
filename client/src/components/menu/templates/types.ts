export interface Cafe {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  logo?: string;
  showProductRatings?: boolean;
  brandColor?: string;
  menuViewMode?: 'card' | 'list';
  welcomeMessage?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  website?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  isMaintenanceMode?: boolean;
  waiterCallOptions?: string[];
  templateId?: string;
  themeConfig?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  isAvailable: boolean;
  stock: number;
  originalPrice?: number;
  isChefRecommended?: boolean;
  averageRating?: number;
  reviewCount?: number;
  requiresPreparation?: boolean;
}

export interface TemplateProps {
  cafe: Cafe;
  cafeId?: string; // Explicitly passed ID fallback
  categories: Category[];
  products: Product[];
  chefProducts: Product[];
  popularProducts: Product[];
  filteredProducts: Product[];
  activeCategory: string;
  searchQuery: string;
  scrolled: boolean;
  tableNumber: string | null;
  customer: Customer | null;
  activeOrders: Order[];
  isCartOpen: boolean;
  welcomeOpen: boolean;
  isAuthDialogOpen: boolean;
  
  // Actions
  onCategorySelect: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setAuthDialogOpen: (open: boolean) => void;
  setWelcomeOpen: (open: boolean) => void;
  setIsCartOpen: (open: boolean) => void;
  handleCancelOrder: (id: string) => void;
  fetchActiveOrders: () => void;
  currentTableId: string | null;
  copyWifi: () => void;
  getSocialUrl: (platform: 'instagram' | 'facebook' | 'twitter' | 'website', url: string) => string;
  isDemoMode?: boolean;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  referralCode?: string;
  avatarUrl?: string;
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  comment?: string;
}

export interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
    requiresPreparation?: boolean;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;
}

export interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  tableId?: string;
  table?: { name: string };
  items: OrderItem[];
  reviews?: Review[];
}
