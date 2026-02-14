'use client';

import { WaiterSocketProvider } from '@/providers/WaiterSocketProvider';

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WaiterSocketProvider>
      {children}
    </WaiterSocketProvider>
  );
}
