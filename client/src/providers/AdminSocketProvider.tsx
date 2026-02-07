'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/lib/api';

interface AdminSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeTablesCount: number;
}

const AdminSocketContext = createContext<AdminSocketContextType>({
  socket: null,
  isConnected: false,
  activeTablesCount: 0,
});

export const useAdminSocket = () => useContext(AdminSocketContext);

export function AdminSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTablesCount, setActiveTablesCount] = useState(0);
  
  // Sound handling
  const soundEnabledRef = useRef(true);

  // Sync sound settings
  useEffect(() => {
    const isEnabledLocal = localStorage.getItem('soundEnabled') !== 'false';
    soundEnabledRef.current = isEnabledLocal;

    const handleStorageChange = () => {
      const newVal = localStorage.getItem('soundEnabled') !== 'false';
      soundEnabledRef.current = newVal;
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    let cafeId: string;
    try {
      const user = JSON.parse(userStr);
      cafeId = user.cafeId;
    } catch (e) {
      console.error('Failed to parse user from local storage', e);
      return;
    }

    if (!cafeId) return;

    console.log('AdminSocketProvider: Connecting to websocket with cafeId:', cafeId);
    
    const newSocket = io(API_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('AdminSocketProvider: Connected');
      setIsConnected(true);
      newSocket.emit('joinAdmin', { cafeId });
    });

    newSocket.on('disconnect', () => {
      console.log('AdminSocketProvider: Disconnected');
      setIsConnected(false);
    });

    newSocket.on('activeTablesUpdate', (count: number) => {
      console.log('AdminSocketProvider: Active tables update:', count);
      setActiveTablesCount(count);
    });

    // We can also handle global notifications here if we want to unify
    // For now, we keep specific widget logic separate but activeTables is shared

    // Avoid synchronous setState in effect
    setTimeout(() => {
      setSocket(newSocket);
    }, 0);

    return () => {
      console.log('AdminSocketProvider: Cleaning up socket');
      newSocket.disconnect();
    };
  }, []);

  return (
    <AdminSocketContext.Provider value={{ socket, isConnected, activeTablesCount }}>
      {children}
    </AdminSocketContext.Provider>
  );
}