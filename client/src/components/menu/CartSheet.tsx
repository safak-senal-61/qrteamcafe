import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cart-store';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface CartSheetProps {
  onOrderSuccess?: () => void;
}

export function CartSheet({ onOrderSuccess }: CartSheetProps) {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  
  const params = useParams();
  const searchParams = useSearchParams();
  const cafeId = params.cafeId as string;
  const tableNumber = searchParams.get('table');
  
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCheckout = async () => {
    if (!tableNumber) {
      toast.error('Lütfen bir masa seçiniz (QR kodu okutunuz).');
      return;
    }

    setLoading(true);
    try {
      const tablesRes = await fetch(`${API_URL}/tables?cafeId=${cafeId}`);
      if (!tablesRes.ok) throw new Error('Masa bilgisi alınamadı');
      
      const tables = await tablesRes.json();
      const currentTable = tables.find((t: any) => t.tableNumber === parseInt(tableNumber));
      
      if (!currentTable) {
        toast.error('Geçersiz masa numarası.');
        return;
      }

      const orderData = {
        tableId: currentTable.id,
        totalAmount: totalPrice,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const res = await fetch(`${API_URL}/orders?cafeId=${cafeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        toast.success('Siparişiniz alındı! Teşekkürler.');
        clearCart();
        setOpen(false);
        if (onOrderSuccess) {
          onOrderSuccess();
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Sipariş verilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              size="lg"
              className="h-16 w-16 rounded-full shadow-2xl relative bg-primary hover:bg-primary/90 text-primary-foreground border-4 border-white ring-2 ring-primary/20"
            >
              <ShoppingBag className="h-7 w-7" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge className="h-6 w-6 flex items-center justify-center rounded-full bg-red-500 text-white border-2 border-white text-xs font-bold shadow-sm">
                      {totalItems}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full w-full sm:max-w-md p-0 border-l-0 rounded-l-[2rem] shadow-2xl overflow-hidden">
        <SheetHeader className="p-6 pb-2 bg-secondary/30">
          <SheetTitle className="flex items-center text-2xl font-bold">
            <div className="bg-primary/10 p-2 rounded-xl mr-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            Sepetim
            <Badge variant="secondary" className="ml-auto text-base px-3 py-1 rounded-lg">
              {totalItems} Ürün
            </Badge>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden relative">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-6 p-8 text-center animate-in fade-in zoom-in duration-500">
              <div className="bg-secondary p-8 rounded-full">
                <ShoppingBag className="h-16 w-16 opacity-20" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-foreground">Sepetiniz Boş</p>
                <p className="text-sm max-w-[200px] mx-auto leading-relaxed">
                  Lezzetli ürünlerimizi keşfetmek için menüye göz atın!
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full px-6 py-4">
              <AnimatePresence initial={false}>
                <div className="space-y-4 pb-24">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="group flex items-center space-x-4 bg-white p-3 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-all"
                    >
                      <div className="relative h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
                        <Image
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop'}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover transition-transform group-hover:scale-110"
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <h4 className="font-bold truncate text-base mb-1">{item.name}</h4>
                        <p className="text-primary font-extrabold text-lg">
                          {(item.price * item.quantity).toFixed(2)} ₺
                        </p>
                        <div className="flex items-center mt-2 space-x-1">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-sm font-bold w-6 text-center tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => {
                                if (item.quantity < item.stock) {
                                    updateQuantity(item.id, item.quantity + 1)
                                }
                            }}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10 transition-all"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </ScrollArea>
          )}
        </div>
        {items.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t p-6 space-y-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Ara Toplam</span>
                <span>{totalPrice.toFixed(2)} ₺</span>
              </div>
              <Separator className="bg-border/50" />
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold">Toplam Tutar</span>
                <span className="text-2xl font-extrabold text-primary">{totalPrice.toFixed(2)} ₺</span>
              </div>
            </div>
            <Button 
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-[0.98] group"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  Siparişi Tamamla
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
