'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, QrCode, Download, X, Bell } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { API_URL, SOCKET_URL } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';

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

interface WaiterCall {
  id: string;
  tableId: string;
  type?: string;
  createdAt: string;
  table?: {
    tableNumber: number;
  };
}

interface Table {
  id: string;
  tableNumber: number;
  isOccupied: boolean;
  lastOccupiedAt?: string;
  waiterCalls?: WaiterCall[];
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTables = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/tables?cafeId=${id}`);
      if (res.ok) {
        setTables(await res.json());
      }
    } catch (error) {
      console.error(error);
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

      socketRef.current.on('waiterCall', (newCall: WaiterCall) => {
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
      console.error(error);
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
      console.error(error);
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
            waiterCalls: table.waiterCalls?.filter((c) => c.id !== callId)
        })));
      }
    } catch (error) {
      console.error(error);
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
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Masalar & QR</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setTableNumber('')} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Yeni Masa
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90vw] sm:max-w-[425px]">
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

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {tables.map((table) => {
              const hasActiveCall = table.waiterCalls && table.waiterCalls.length > 0;
              const isOccupied = table.isOccupied;

              return (
                <div
                  key={table.id}
                  onClick={() => setQrTable(table)}
                  className={cn(
                    "group relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-[1.5rem] border-2 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm",
                    hasActiveCall 
                      ? "border-amber-400 bg-amber-50/90 shadow-lg shadow-amber-500/20 hover:scale-105" 
                      : isOccupied
                        ? "border-red-100 bg-red-50/50 hover:border-red-200 hover:shadow-md hover:-translate-y-1"
                        : "border-border/40 bg-white/80 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                  )}
                >
                  {/* Status Indicator Dot */}
                  <div className={cn(
                    "absolute top-3 right-3 w-3 h-3 rounded-full shadow-sm",
                    hasActiveCall ? "bg-amber-500 animate-ping" : 
                    isOccupied ? "bg-red-500" : "bg-emerald-400"
                  )} />
                  
                  {/* Delete Button (Hover only) */}
                  {!hasActiveCall && (
                    <div 
                      className="absolute top-2 left-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 rounded-full cursor-pointer text-muted-foreground hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(table.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </div>
                  )}
                  
                  {/* Main Icon Area */}
                  <div className={cn(
                    "mb-4 p-4 rounded-2xl transition-all duration-300 shadow-sm",
                    hasActiveCall 
                      ? "bg-amber-100 text-amber-600 rotate-12 scale-110" 
                      : isOccupied
                        ? "bg-red-100 text-red-600 group-hover:scale-105"
                        : "bg-gradient-to-br from-primary/5 to-primary/10 text-primary group-hover:from-primary/10 group-hover:to-primary/20 group-hover:scale-110"
                  )}>
                    {hasActiveCall ? (
                      <Bell className="w-7 h-7 animate-bounce" />
                    ) : (
                      <QrCode className="w-7 h-7" />
                    )}
                  </div>

                  {/* Table Name */}
                  <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-primary transition-colors">
                    Masa {table.tableNumber}
                  </h3>

                  {/* Status Text / Timer / Action */}
                  <div className="w-full">
                    {hasActiveCall ? (
                      <Button 
                        size="sm" 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-amber-200 shadow-md rounded-xl"
                        onClick={(e) => table.waiterCalls?.[0]?.id && handleCompleteCall(e, table.waiterCalls[0].id)}
                      >
                        Tamamla
                      </Button>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 w-full">
                        <span className={cn(
                          "text-xs font-semibold px-3 py-1 rounded-full w-full text-center transition-colors",
                          isOccupied ? "bg-red-100 text-red-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {isOccupied ? 'Dolu' : 'Boş'}
                        </span>
                        {isOccupied && table.lastOccupiedAt && (
                          <div className="text-xs font-medium text-muted-foreground bg-gray-50 px-2 py-0.5 rounded-md">
                            <TableDuration startTime={table.lastOccupiedAt} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!qrTable} onOpenChange={(open) => !open && setQrTable(null)}>
        <DialogContent className="w-[90vw] max-w-[360px] sm:max-w-md bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-3xl mx-auto">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Masa {qrTable?.tableNumber}
            </DialogTitle>
            <DialogDescription className="hidden">
              Masa QR Kodu
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 space-y-6 sm:space-y-8">
            <div className="relative group transform sm:hover:scale-105 transition-transform duration-300 w-full max-w-[250px] aspect-square mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white p-4 sm:p-6 rounded-[1.75rem] shadow-xl border border-gray-100 w-full h-full flex items-center justify-center">
                <QRCodeCanvas
                  id="qr-code-canvas"
                  value={typeof window !== 'undefined' ? `${window.location.origin}/menu/${cafeId}?table=${qrTable?.tableNumber}` : ''}
                  size={256}
                  level={"H"}
                  includeMargin={true}
                  imageSettings={{
                    src: "/favicon.ico",
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                  className="w-full h-full object-contain"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <Button 
                onClick={downloadQR}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-4 sm:py-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <Download className="mr-2 h-5 w-5" />
                QR İndir
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setQrTable(null)}
                className="flex-1 border-2 hover:bg-secondary/50 font-semibold py-4 sm:py-6 rounded-xl transition-all duration-300"
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
