import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  originalPrice?: number;
  isChefRecommended?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

export interface CartItem extends Product {
  quantity: number;
  note?: string;
  cartItemId: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, note?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItem: (cartItemId: string, updates: Partial<Pick<CartItem, 'quantity' | 'note'>>) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, note) => {
        const items = get().items;
        // Check if item with same product ID AND same note exists
        const existingItem = items.find((item) => item.id === product.id && item.note === note);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.cartItemId === existingItem.cartItemId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          // Create new item with unique cartItemId
          const newItem: CartItem = {
            ...product,
            quantity: 1,
            note,
            cartItemId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
          };
          set({ items: [...items, newItem] });
        }
      },
      removeItem: (cartItemId) => {
        set({
          items: get().items.filter((item) => item.cartItemId !== cartItemId),
        });
      },
      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity } : item
          ),
        });
      },
      updateItem: (cartItemId, updates) => {
        set({
          items: get().items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, ...updates } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: 'cart-storage',
    }
  )
);
