'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface WaiterSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

interface SocketOrder {
  id: string;
  table?: {
    tableNumber: number;
  };
  status: string;
}

interface SocketCall {
  tableNumber: number;
  type: 'HESAP' | 'GARSON' | 'BILL';
}

const WaiterSocketContext = createContext<WaiterSocketContextType>({
  socket: null,
  isConnected: false,
});

export const useWaiterSocket = () => useContext(WaiterSocketContext);

export function WaiterSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  
  // Audio refs
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSound.current = new Audio('https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3'); // Same as Admin Widget
  }, []);

  const playSound = useCallback(() => {
    if (notificationSound.current) {
      notificationSound.current.play().catch(e => console.error('Audio play failed', e));
    }
  }, []);

  useEffect(() => {
    const waiterInfo = localStorage.getItem('waiter-info');
    if (!waiterInfo) return;

    let cafeId: string;
    try {
      const waiter = JSON.parse(waiterInfo);
      cafeId = waiter.cafeId;
    } catch (e) {
      console.error('Failed to parse waiter info', e);
      return;
    }

    if (!cafeId) return;

    console.log('WaiterSocketProvider: Connecting to websocket with cafeId:', cafeId);
    
    const newSocket = io(API_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('WaiterSocketProvider: Connected');
      setIsConnected(true);
      newSocket.emit('joinWaiter', { cafeId });
    });

    newSocket.on('disconnect', () => {
      console.log('WaiterSocketProvider: Disconnected');
      setIsConnected(false);
    });

    // Listeners
    newSocket.on('newOrder', (order: SocketOrder) => {
        playSound();
        toast({
            title: 'Yeni Sipariş!',
            description: `Masa ${order.table?.tableNumber || '?'} için yeni sipariş geldi.`,
            variant: 'default',
        });
    });

    newSocket.on('orderStatusUpdate', (order: SocketOrder) => {
        if (order.status === 'READY') {
            playSound();
            toast({
                title: 'Sipariş Hazır!',
                description: `Masa ${order.table?.tableNumber || '?'} siparişi hazır.`,
                variant: 'default', // Maybe success color
                className: 'bg-green-500 text-white',
            });
        }
    });

    newSocket.on('waiterCall', (call: SocketCall) => {
        playSound();
        const typeLabel = call.type === 'HESAP' ? 'Hesap İsteği' : 'Garson Çağrısı';
        toast({
            title: typeLabel,
            description: `Masa ${call.tableNumber} ${typeLabel.toLowerCase()} gönderdi.`,
            variant: 'destructive',
        });
    });

    setTimeout(() => {
      setSocket(newSocket);
    }, 0);

    return () => {
      console.log('WaiterSocketProvider: Cleaning up socket');
      newSocket.disconnect();
    };
  }, [toast, playSound]);

  return (
    <WaiterSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WaiterSocketContext.Provider>
  );
}
