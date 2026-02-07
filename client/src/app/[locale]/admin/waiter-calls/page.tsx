'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, Clock, Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';
import { useAdminSocket } from '@/providers/AdminSocketProvider';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface WaiterCall {
  id: string;
  tableId: string;
  cafeId: string;
  type?: string;
  status: 'PENDING' | 'COMPLETED';
  createdAt: string;
  table: {
    tableNumber: number;
  };
}

const OPTION_LABELS: Record<string, string> = {
  'bill': 'Hesap İste',
  'waiter': 'Garson Çağır',
  'cleanup': 'Masayı Topla',
  'ashtray': 'Küllük İste'
};

export default function WaiterCallsPage() {
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useAdminSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Audio for notification
    audioRef.current = new Audio('https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3'); 
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const cafeId = user.cafeId;

    const fetchCalls = async () => {
      try {
        const res = await fetch(`${API_URL}/waiter-calls?cafeId=${cafeId}&status=PENDING`);
        if (res.ok) {
          const data = await res.json();
          setCalls(data);
        }
      } catch (error) {
        console.error('Error fetching calls:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();

    if (!socket) return;

    const onWaiterCall = (newCall: WaiterCall) => {
        // Play sound
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }
        const label = newCall.type ? (OPTION_LABELS[newCall.type] || newCall.type) : 'Garson';
        toast.info(`${newCall.table?.tableNumber || '?'} . Masa: ${label}`);
        setCalls(prev => [newCall, ...prev]);
    };

    socket.on('waiterCall', onWaiterCall);

    return () => {
      socket.off('waiterCall', onWaiterCall);
    };
  }, [socket]);

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/waiter-calls/${id}/complete`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setCalls(prev => prev.filter(call => call.id !== id));
        toast.success('Çağrı tamamlandı.');
      }
    } catch (error) {
      console.error(error);
      toast.error('İşlem başarısız.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Garson Çağrıları</h1>
        <Badge variant="outline" className="text-lg px-4 py-1">
          {calls.length} Bekleyen
        </Badge>
      </div>

      {calls.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <div className="bg-background p-4 rounded-full mb-4">
              <Bell className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-lg font-medium">Bekleyen çağrı yok</p>
            <p className="text-sm">Müşteriler garson çağırdığında burada görünecek.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calls.map((call) => (
            <Card key={call.id} className="border-l-4 border-l-amber-500 shadow-md animate-in slide-in-from-bottom-5 duration-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-700 p-2 rounded-lg text-2xl font-bold">
                      {call.table?.tableNumber}
                    </span>
                    <span className="text-lg">. Masa</span>
                  </div>
                  <Badge variant="secondary" className="animate-pulse bg-amber-500 text-white hover:bg-amber-600">
                    Bekliyor
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {call.type && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-md">
                    <p className="text-amber-900 font-medium text-center text-lg">
                      {OPTION_LABELS[call.type] || call.type}
                    </p>
                  </div>
                )}
                <div className="flex items-center text-muted-foreground text-sm mb-6">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true, locale: tr })}
                </div>
                <Button 
                  className="w-full font-bold" 
                  size="lg"
                  onClick={() => handleComplete(call.id)}
                >
                  <Check className="mr-2 h-5 w-5" />
                  Tamamlandı
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
