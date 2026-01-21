'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, QrCode, Download, X, Bell } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { API_URL, SOCKET_URL } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

function TableDuration({ startTime }: { startTime: string }) {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const update = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setDuration(`${hours}sa ${minutes}dk`);
      } else {
        setDuration(`${minutes}dk`);
      }
    };
    
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="text-xs text-muted-foreground font-mono mt-1">{duration}</span>;
}

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [qrTable, setQrTable] = useState<any | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTables = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/tables?cafeId=${id}`);
      if (res.ok) {
        setTables(await res.json());
      }
    } catch (error) {
      toast.error('Masalar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Audio init
    audioRef.current = new Audio('https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3');

    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCafeId(user.cafeId);
      fetchTables(user.cafeId);

      // Socket connection
      socketRef.current = io(SOCKET_URL || 'http://localhost:3001');
      socketRef.current.on('connect', () => {
        socketRef.current?.emit('joinAdmin', { cafeId: user.cafeId });
      });

      socketRef.current.on('waiterCall', (newCall: any) => {
        // Play sound
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }
        
        // Update table state to show waiter call
        setTables(prevTables => prevTables.map(table => {
          if (table.id === newCall.tableId) {
             // Add to waiterCalls array if not exists (though typically we just need to know if there's any)
             const existingCalls = table.waiterCalls || [];
             return { ...table, waiterCalls: [...existingCalls, newCall] };
          }
          return table;
        }));

        toast.info(`${newCall.table?.tableNumber || '?'} . Masa garson çağırıyor!`);
      });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;

    try {
      const res = await fetch(`${API_URL}/tables?cafeId=${cafeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: parseInt(tableNumber) }),
      });

      if (res.ok) {
        toast.success('Masa eklendi.');
        fetchTables(cafeId);
        setIsDialogOpen(false);
        setTableNumber('');
      } else {
        const error = await res.json();
        toast.error(error.message || 'İşlem başarısız.');
      }
    } catch (error) {
      toast.error('Hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu masayı silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`${API_URL}/tables/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Masa silindi.');
        if (cafeId) fetchTables(cafeId);
      }
    } catch (error) {
      toast.error('Silme işlemi başarısız.');
    }
  };

  const handleCompleteCall = async (e: React.MouseEvent, callId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/waiter-calls/${callId}/complete`, {
        method: 'PATCH',
      });
      if (res.ok) {
        toast.success('Çağrı tamamlandı.');
        // Update local state
        setTables(prevTables => prevTables.map(table => ({
            ...table,
            waiterCalls: table.waiterCalls?.filter((c: any) => c.id !== callId)
        })));
      }
    } catch (error) {
      toast.error('İşlem başarısız.');
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `Masa-${qrTable?.tableNumber}-QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Masalar & QR</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setTableNumber('')}>
              <Plus className="mr-2 h-4 w-4" /> Yeni Masa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Masa Ekle</DialogTitle>
              <DialogDescription>
                Kafeye yeni bir masa eklemek için masa numarasını giriniz.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
              <Label htmlFor="tableNumber">Masa Numarası</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Masa Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map((table) => {
                const hasActiveCall = table.waiterCalls && table.waiterCalls.length > 0;
                
                return (
                <Card 
                    key={table.id} 
                    className={`relative overflow-hidden group transition-all cursor-pointer ${
                        hasActiveCall 
                        ? 'border-amber-500 shadow-lg shadow-amber-500/20 bg-amber-50/50 animate-pulse' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setQrTable(table)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center space-y-3">
                    <div className={`p-3 rounded-full transition-colors ${
                        hasActiveCall ? 'bg-amber-100 text-amber-600' : 'bg-secondary group-hover:bg-primary/10'
                    }`}>
                      {hasActiveCall ? (
                          <Bell className="h-6 w-6 animate-bounce" />
                      ) : (
                          <QrCode className="h-6 w-6 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    
                    <span className="font-bold text-lg">Masa {table.tableNumber}</span>
                    
                    {hasActiveCall ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full animate-pulse">
                                GARSON ÇAĞIRIYOR
                            </span>
                            <Button 
                                size="sm" 
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white h-7 text-xs"
                                onClick={(e) => handleCompleteCall(e, table.waiterCalls[0].id)}
                            >
                                Tamamlandı
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${table.isOccupied ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {table.isOccupied ? 'Dolu' : 'Boş'}
                          </span>
                          {table.isOccupied && table.lastOccupiedAt && (
                            <TableDuration startTime={table.lastOccupiedAt} />
                          )}
                        </div>
                    )}
                    
                    {!hasActiveCall && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50" 
                            onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(table.id);
                            }}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                        </div>
                    )}
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={!!qrTable} onOpenChange={(open) => !open && setQrTable(null)}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-3xl">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Masa {qrTable?.tableNumber}
            </DialogTitle>
            <DialogDescription className="hidden">
              Masa QR Kodu
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-8">
            <div className="relative group transform hover:scale-105 transition-transform duration-300">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white p-6 rounded-[1.75rem] shadow-xl border border-gray-100">
                <QRCodeCanvas
                  id="qr-code-canvas"
                  value={typeof window !== 'undefined' ? `${window.location.origin}/menu/${cafeId}?table=${qrTable?.tableNumber}` : ''}
                  size={240}
                  level={"H"}
                  includeMargin={true}
                  imageSettings={{
                    src: "/favicon.ico",
                    x: undefined,
                    y: undefined,
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-4 w-full">
              <Button 
                onClick={downloadQR}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <Download className="mr-2 h-5 w-5" />
                QR İndir
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setQrTable(null)}
                className="flex-1 border-2 hover:bg-secondary/50 font-semibold py-6 rounded-xl transition-all duration-300"
              >
                <X className="mr-2 h-5 w-5" />
                Kapat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
