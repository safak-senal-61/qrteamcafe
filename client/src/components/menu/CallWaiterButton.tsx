import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

export function CallWaiterButton() {
  const params = useParams();
  const searchParams = useSearchParams();
  const cafeId = params.cafeId as string;
  const tableNumber = searchParams.get('table');
  
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const handleCallWaiter = async () => {
    if (!tableNumber) {
      toast.error('Masa bilgisi bulunamadı (QR kodu okutunuz).');
      return;
    }

    setLoading(true);
    try {
      // Get table ID first
      const tablesRes = await fetch(`${API_URL}/tables?cafeId=${cafeId}`);
      if (!tablesRes.ok) throw new Error('Masa bilgisi alınamadı');
      
      const tables = await tablesRes.json();
      const currentTable = tables.find((t: any) => t.tableNumber === parseInt(tableNumber));
      
      if (!currentTable) {
        toast.error('Geçersiz masa numarası.');
        return;
      }

      const res = await fetch(`${API_URL}/waiter-calls?cafeId=${cafeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: currentTable.id }),
      });

      if (res.ok) {
        toast.success('Garson çağrıldı! En kısa sürede ilgileneceğiz.');
        setOpen(false);
        setCooldown(true);
        // 1 minute cooldown
        setTimeout(() => setCooldown(false), 60000);
      } else {
        toast.error('Garson çağrılırken bir hata oluştu.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!tableNumber) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="fixed bottom-24 left-6 z-50">
           <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-12 rounded-full shadow-xl bg-white/90 backdrop-blur-sm border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-600"
              disabled={cooldown}
            >
              <Bell className={`h-6 w-6 ${cooldown ? 'opacity-50' : ''}`} />
            </Button>
          </motion.div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Garson Çağır</DialogTitle>
          <DialogDescription>
            {tableNumber}. Masa için garson çağırmak istiyor musunuz?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none">
              Vazgeç
            </Button>
          </DialogClose>
          <Button 
            type="submit" 
            onClick={handleCallWaiter} 
            disabled={loading}
            className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Garson Çağır
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
