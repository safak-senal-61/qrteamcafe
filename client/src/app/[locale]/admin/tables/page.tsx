'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, QrCode, Download, X, Bell } from 'lucide-react';
import { CustomQRCode } from '@/components/ui/CustomQRCode';
import { API_URL } from '@/lib/api';
import { useAdminSocket } from '@/providers/AdminSocketProvider';
import { cn } from '@/lib/utils';

// Helper to construct full URL
const getFullUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  // If it looks like a relative path stored as full URL with old IP/domain, fix it
  // Specifically for our uploads folder
  if (url.startsWith('http') && url.includes('/uploads/')) {
    try {
      const urlObj = new URL(url);
      // Use current API_URL + path
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      return `${baseUrl}${urlObj.pathname}`;
    } catch {
      // Fallback if URL parsing fails
      return url;
    }
  }

  if (url.startsWith('http')) return url;
  
  const baseUrl = API_URL;
  // Remove trailing slash from baseUrl if exists
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // Ensure url starts with /
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBaseUrl}${cleanUrl}`;
};

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
  const [cafeLogo, setCafeLogo] = useState<string | null>(null);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  
  const { socket } = useAdminSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchCafe = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/cafes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.logoUrl) {
            setCafeLogo(getFullUrl(data.logoUrl));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTables = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tables?cafeId=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      fetchCafe(user.cafeId);

      if (!socket) return;

      const onWaiterCall = (newCall: WaiterCall) => {
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
      };

      socket.on('waiterCall', onWaiterCall);

      return () => {
        socket.off('waiterCall', onWaiterCall);
      };
    }
  }, [socket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tables?cafeId=${cafeId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tables/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/waiter-calls/${callId}/complete`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
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

  const [downloading, setDownloading] = useState(false);

  const downloadQR = async () => {
    const container = document.getElementById('qr-code-container');
    const svg = document.getElementById('custom-qr-code-svg');
    if (!container || !svg) return;

    setDownloading(true);
    try {
      const size = 1000;
      const padding = 100; // Padding around QR code
      const cornerRadius = 100; // Rounded corners radius

      // 1. Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // 2. Draw rounded white background with shadow effect (simulated)
      ctx.fillStyle = 'white';
      
      // Draw rounded rectangle
      ctx.beginPath();
      ctx.roundRect(20, 20, size - 40, size - 40, cornerRadius);
      ctx.fill();

      // Add simple border to simulate the card look
      ctx.strokeStyle = '#e2e8f0'; // slate-200
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Prepare QR Code SVG
      const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
      const qrSize = size - (padding * 2);
      
      clonedSvg.setAttribute('width', qrSize.toString());
      clonedSvg.setAttribute('height', qrSize.toString());
      clonedSvg.removeAttribute('class');
      clonedSvg.style.width = `${qrSize}px`;
      clonedSvg.style.height = `${qrSize}px`;

      // 4. Handle Logo (same as before)
      const logoImage = clonedSvg.querySelector('image');
      if (logoImage) {
          const href = logoImage.getAttribute('href') || logoImage.getAttribute('xlink:href');
          if (href) {
              try {
                  if (href.startsWith('data:')) {
                     // already base64
                  } else {
                     let response;
                     try {
                        response = await fetch(href, { mode: 'cors' });
                     } catch {
                        const proxyUrl = `${API_URL}/proxy-image?url=${encodeURIComponent(href)}`;
                        response = await fetch(proxyUrl);
                     }

                     if (response && response.ok) {
                         const blob = await response.blob();
                         const base64data = await new Promise<string>((resolve, reject) => {
                             const reader = new FileReader();
                             reader.onloadend = () => resolve(reader.result as string);
                             reader.onerror = reject;
                             reader.readAsDataURL(blob);
                         });
                         logoImage.setAttribute('href', base64data);
                     } else {
                        console.warn('Logo fetch failed');
                        logoImage.remove(); 
                     }
                  }
              } catch (e) {
                  console.error("Failed to convert logo to base64", e);
                  logoImage.remove();
              }
          }
      }

      // 5. Draw SVG to Canvas centered
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const img = new window.Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      await new Promise((resolve, reject) => {
          img.onload = () => {
              ctx.drawImage(img, padding, padding, qrSize, qrSize);
              URL.revokeObjectURL(url);
              resolve(null);
          };
          img.onerror = (e) => {
              URL.revokeObjectURL(url);
              reject(e);
          };
          img.src = url;
      });
      
      // 6. Download
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `Masa-${qrTable?.tableNumber}-QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast.success('QR kod başarıyla indirildi.');
    } catch (error) {
      console.error('QR download failed:', error);
      toast.error('QR kod indirilirken bir hata oluştu.');
    } finally {
      setDownloading(false);
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
                    isOccupied ? "bg-red-500" : "bg-primary"
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
                          isOccupied ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
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
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div id="qr-code-container" className="relative group transform sm:hover:scale-105 transition-transform duration-300 w-full max-w-[320px] aspect-square mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white p-4 sm:p-6 rounded-[1.75rem] shadow-xl border border-gray-100 w-full h-full flex items-center justify-center">
              <CustomQRCode
                value={typeof window !== 'undefined' ? `${window.location.origin}/menu/${cafeId}?table=${qrTable?.tableNumber}` : ''}
                size={300}
                logoUrl={cafeLogo || undefined}
                className="max-w-full" // Override max-width: 300px from component if needed, though w-full handles it
              />
            </div>
          </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <Button 
                onClick={downloadQR}
                disabled={downloading}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-4 sm:py-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                {downloading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
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
