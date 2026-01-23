import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  referralCode?: string;
  avatarUrl?: string;
}

interface CustomerState {
  customer: Customer | null;
  token: string | null;
  setCustomer: (customer: Customer, token: string) => void;
  logout: () => void;
  isAuthDialogOpen: boolean;
  setAuthDialogOpen: (open: boolean) => void;
  isGuest: boolean;
  setGuest: (isGuest: boolean) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      customer: null,
      token: null,
      isAuthDialogOpen: false,
      isGuest: false,
      _hasHydrated: false,
      setCustomer: (customer, token) => set({ customer, token, isGuest: false }),
      logout: () => set({ customer: null, token: null, isGuest: false }),
      setAuthDialogOpen: (open) => set({ isAuthDialogOpen: open }),
      setGuest: (isGuest) => set({ isGuest }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'customer-storage',
      partialize: (state) => ({ customer: state.customer, token: state.token, isGuest: state.isGuest }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
