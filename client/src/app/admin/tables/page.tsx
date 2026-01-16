'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, QrCode, Download, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { API_URL } from '@/lib/api';

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [qrTable, setQrTable] = useState<any | null>(null);

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
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCafeId(user.cafeId);
      fetchTables(user.cafeId);
    }
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
              {tables.map((table) => (
                <Card key={table.id} className="relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setQrTable(table)}>
                  <CardContent className="p-4 flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-secondary rounded-full group-hover:bg-primary/10 transition-colors">
                      <QrCode className="h-6 w-6 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="font-bold text-lg">Masa {table.tableNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${table.isOccupied ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {table.isOccupied ? 'Dolu' : 'Boş'}
                    </span>
                    
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
                  </CardContent>
                </Card>
              ))}
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
                  className="rounded-xl"
                />
                
                {/* Decorative Corners */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg"></div>
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg"></div>
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg"></div>
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg"></div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Müşterileriniz için QR kodu indirin ve masaya yapıştırın.
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 rounded-xl h-11 border-gray-200 hover:bg-gray-50 hover:text-gray-900" onClick={() => setQrTable(null)}>
                Kapat
              </Button>
              <Button className="flex-1 gap-2 rounded-xl h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" onClick={downloadQR}>
                <Download className="h-4 w-4" />
                İndir (PNG)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
