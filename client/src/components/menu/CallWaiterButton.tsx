import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { motion } from 'framer-motion';
import { useCustomerStore } from '@/store/customer-store';
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

const OPTION_LABELS: Record<string, string> = {
  'bill': 'Hesap İste',
  'waiter': 'Garson Çağır',
  'cleanup': 'Masayı Topla',
  'ashtray': 'Küllük İste'
};

interface CallWaiterButtonProps {
  options?: string[] | string | null;
}

export function CallWaiterButton({ options }: CallWaiterButtonProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const cafeId = params.cafeId as string;
  const tableNumber = searchParams.get('table');
  const { token } = useCustomerStore();
  
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  // Parse options safely
  let parsedOptions: string[] = [];
  try {
    if (Array.isArray(options)) {
      parsedOptions = options;
    } else if (typeof options === 'string') {
      // Check if it looks like a JSON array
      if (options.trim().startsWith('[') && options.trim().endsWith(']')) {
         parsedOptions = JSON.parse(options);
      } else {
         // Maybe it's a comma separated string? Or just single value? 
         // For now assume JSON if string, or empty.
         parsedOptions = JSON.parse(options);
      }
    }
  } catch (e) {
    console.error('Error parsing waiter call options:', e);
    parsedOptions = [];
  }

  const handleCallWaiter = async (type: string = 'Garson') => {
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
      const currentTable = tables.find((t: { id: string; tableNumber: number }) => t.tableNumber === parseInt(tableNumber));
      
      if (!currentTable) {
        toast.error('Geçersiz masa numarası.');
        return;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/waiter-calls?cafeId=${cafeId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tableId: currentTable.id, type }),
      });

      if (res.ok) {
        const label = OPTION_LABELS[type] || type;
        toast.success(`${label} talebiniz iletildi!`);
        setOpen(false);
        setCooldown(true);
        // 1 minute cooldown
        setTimeout(() => setCooldown(false), 60000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || 'Talep iletilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!tableNumber) return null;

  const hasOptions = parsedOptions.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="fixed bottom-6 left-6 z-50">
           <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              size="lg"
              className="h-16 w-16 rounded-full shadow-2xl bg-amber-500 hover:bg-amber-600 text-white border-4 border-white ring-2 ring-amber-500/20"
              disabled={cooldown}
            >
              <Bell className={`h-8 w-8 ${cooldown ? 'opacity-50' : ''}`} />
            </Button>
          </motion.div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Garson Çağır</DialogTitle>
          <DialogDescription>
            {hasOptions 
              ? `${tableNumber}. Masa için isteğinizi seçiniz:` 
              : `${tableNumber}. Masa için garson çağırmak istiyor musunuz?`
            }
          </DialogDescription>
        </DialogHeader>

        {hasOptions ? (
          <div className="grid grid-cols-1 gap-3 py-4">
            {parsedOptions.map((option: string, idx: number) => (
              <Button 
                key={idx} 
                variant="outline" 
                className="w-full justify-start h-12 text-lg hover:bg-amber-50 hover:text-amber-700 hover:border-amber-500"
                onClick={() => handleCallWaiter(option)}
                disabled={loading}
              >
                <CheckCircle2 className="mr-3 h-5 w-5 text-amber-500" />
                {OPTION_LABELS[option] || option}
              </Button>
            ))}
          </div>
        ) : (
          <div className="py-4">
             <p className="text-center text-muted-foreground">Garsonunuz en kısa sürede masanızda olacaktır.</p>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none">
              Vazgeç
            </Button>
          </DialogClose>
          {!hasOptions && (
            <Button 
              type="submit" 
              onClick={() => handleCallWaiter('Garson')} 
              disabled={loading}
              className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Garson Çağır
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
