'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCustomerStore } from '@/store/customer-store';
import { useCartStore } from '@/store/cart-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CreateReviewDialog } from './CreateReviewDialog';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Loader2, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChefHat,
  MessageSquare
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
    requiresPreparation?: boolean;
  };
  quantity: number;
  unitPrice: number | string;
}

interface Review {
  id: string;
  productId: string;
  rating: number;
  comment?: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number | string;
  items: OrderItem[];
  reviews?: Review[];
}

interface CartSheetProps {
  cafeId?: string;
  tableId?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  activeOrders?: Order[];
  onOrderSuccess?: () => void;
  onCancelOrder?: (orderId: string) => void;
}

export function CartSheet({ 
  cafeId, 
  tableId, 
  isOpen, 
  onOpenChange, 
  activeOrders = [], 
  onOrderSuccess, 
  onCancelOrder 
}: CartSheetProps) {
  // Internal state for uncontrolled mode if needed, though we prefer controlled from MenuPage
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('cart');
  
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCartStore();
  const { customer, setAuthDialogOpen, isGuest } = useCustomerStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const activeOrdersCount = activeOrders.length;
  const totalBadgeCount = totalItems + activeOrdersCount;

  // Auto-switch tab based on activity
  useEffect(() => {
    if (open) {
      if (items.length > 0) {
        setActiveTab('cart');
      } else if (activeOrders.length > 0) {
        setActiveTab('orders');
      }
    }
  }, [open, items.length, activeOrders.length]);

  const handleCheckout = async () => {
    if (!customer && !isGuest) {
      toast.info('Sipariş vermek için lütfen giriş yapınız veya misafir olarak devam ediniz');
      // setOpen(false); // Keep cart open so user can continue easily after auth dialog closes
      setAuthDialogOpen(true);
      return;
    }

    // Fallback: Try to get tableId from localStorage if prop is missing
    let activeTableId = tableId;
    if (!activeTableId && cafeId) {
        const storageKey = `cafe_${cafeId}_tableId`;
        if (typeof window !== 'undefined') {
            const storedTableId = localStorage.getItem(storageKey);
            if (storedTableId) {
                activeTableId = storedTableId;
                console.log('Recovered tableId from storage in CartSheet:', activeTableId);
            }
        }
    }

    if (!cafeId || !activeTableId) {
      toast.error('Masa veya kafe bilgisi eksik. Lütfen QR kodu tekrar okutunuz.');
      console.error('Missing info:', { cafeId, tableIdProp: tableId, activeTableId });
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        tableId: activeTableId,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          note: item.note
        })),
        customerId: customer?.id,
      };

      await api.post(`/orders?cafeId=${cafeId}`, orderData);

      toast.success('Siparişiniz başarıyla alındı!');
      clearCart();
      
      if (onOrderSuccess) {
        onOrderSuccess();
      }
      
      // Switch to orders tab
      setActiveTab('orders');
    } catch (error: unknown) {
      console.error('Order error:', error);
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Sipariş oluşturulurken bir hata oluştu');
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
              {totalItems > 0 ? <ShoppingBag className="h-7 w-7" /> : <ClipboardList className="h-7 w-7" />}
              <AnimatePresence>
                {totalBadgeCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge className="h-6 w-6 flex items-center justify-center rounded-full bg-red-500 text-white border-2 border-white text-xs font-bold shadow-sm">
                      {totalBadgeCount}
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
              {activeTab === 'cart' ? <ShoppingBag className="h-6 w-6 text-primary" /> : <ClipboardList className="h-6 w-6 text-primary" />}
            </div>
            {activeTab === 'cart' ? 'Sepetim' : 'Siparişlerim'}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cart">Sepetim ({totalItems})</TabsTrigger>
              <TabsTrigger value="orders">Siparişlerim ({activeOrdersCount})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="cart" className="flex-1 overflow-hidden relative mt-0 data-[state=inactive]:hidden">
            <div className="flex-1 overflow-hidden relative flex flex-col h-full">
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
                <>
                  <ScrollArea className="flex-1 -mr-4 pr-4">
                    <div className="px-6 py-4">
                      <AnimatePresence initial={false}>
                        <div className="space-y-4 pb-4">
                          {items.map((item) => (
                            <motion.div
                              key={item.cartItemId}
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
                                  unoptimized={!!item.image?.includes('localhost') || !!item.image?.includes('127.0.0.1') || !!item.image?.startsWith('/uploads/')}
                                />
                              </div>
                              <div className="flex-1 min-w-0 py-1">
                                <h4 className="font-bold truncate text-base mb-1">{item.name}</h4>
                                {item.note && (
                                  <p className="text-xs text-muted-foreground mb-1 italic">
                                    Not: {item.note}
                                  </p>
                                )}
                                <p className="text-primary font-extrabold text-lg">
                                  {(item.price * item.quantity).toFixed(2)} ₺
                                </p>
                                <div className="flex items-center mt-2 space-x-1">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
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
                                        if (item.stock && item.quantity < item.stock) {
                                            updateQuantity(item.cartItemId, item.quantity + 1)
                                        }
                                    }}
                                    disabled={!!item.stock && item.quantity >= item.stock}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10 transition-all"
                                onClick={() => removeItem(item.cartItemId)}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                  
                  <div className="bg-background/80 backdrop-blur-xl border-t p-6 space-y-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10 relative">
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
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="flex-1 overflow-hidden relative mt-0 data-[state=inactive]:hidden">
             <ScrollArea className="h-full px-6 py-4">
              {activeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center">
                  <ClipboardList className="w-12 h-12 mb-4 opacity-20" />
                  <p>Henüz siparişiniz bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-4 pb-24">
                  {activeOrders.map((order) => (
                    <div key={order.id} className="bg-secondary/20 rounded-xl p-4 border relative overflow-hidden">
                       {/* Status Stripe */}
                       <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                         order.status === 'PENDING' ? 'bg-yellow-500' :
                         order.status === 'PREPARING' ? 'bg-blue-500' :
                         order.status === 'READY' ? 'bg-green-500' :
                         order.status === 'DELIVERED' ? 'bg-green-700' : 
                         order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-500'
                       }`} />
                       
                       <div className="flex justify-between items-start mb-3 pl-3">
                         <div>
                           <p className="text-xs text-muted-foreground font-medium">Sipariş No</p>
                           <p className="font-mono text-sm font-bold">#{order.id.slice(-4)}</p>
                         </div>
                         <Badge className={
                            order.status === 'PENDING' ? 'bg-yellow-500 hover:bg-yellow-600' :
                            order.status === 'PREPARING' ? 'bg-blue-500 hover:bg-blue-600' :
                            order.status === 'READY' ? 'bg-green-500 hover:bg-green-600' :
                            order.status === 'DELIVERED' ? 'bg-green-700 hover:bg-green-800' : 
                            order.status === 'CANCELLED' ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500'
                         }>
                            {(() => {
                              const hasPrepItems = order.items?.some((item) => item.product?.requiresPreparation !== false) ?? true;
                              
                              if (order.status === 'PENDING') return <><Clock className="w-3 h-3 mr-1" /> Bekliyor</>;
                              if (order.status === 'PREPARING') return hasPrepItems ? <><ChefHat className="w-3 h-3 mr-1" /> Hazırlanıyor</> : <><CheckCircle2 className="w-3 h-3 mr-1" /> Sipariş Alındı</>;
                              if (order.status === 'READY') return hasPrepItems ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Hazır</> : <><CheckCircle2 className="w-3 h-3 mr-1" /> Servise Hazır</>;
                              if (order.status === 'DELIVERED') return <><CheckCircle2 className="w-3 h-3 mr-1" /> Teslim Edildi</>;
                              if (order.status === 'CANCELLED') return <><XCircle className="w-3 h-3 mr-1" /> İptal Edildi</>;
                              return order.status;
                            })()}
                         </Badge>
                       </div>
                       
                       <div className="space-y-2 mb-4 pl-3">
                         {order.items?.map((item, idx) => (
                           <div key={idx} className="flex justify-between text-sm">
                             <span className="text-muted-foreground">
                               {item.quantity}x {item.product?.name || 'Ürün'}
                             </span>
                             <span className="font-medium">
                               {(Number(item.unitPrice) * item.quantity).toFixed(2)} ₺
                             </span>
                           </div>
                         ))}
                       </div>
                       
                       <div className="flex items-center justify-between pl-3 pt-3 border-t">
                         <span className="font-bold">Toplam</span>
                         <span className="font-bold text-lg text-primary">{Number(order.totalAmount).toFixed(2)} ₺</span>
                       </div>

                       {order.status === 'PENDING' && onCancelOrder && (
                         <div className="mt-4 pl-3">
                           <Button 
                             variant="destructive" 
                             size="sm" 
                             className="w-full"
                             onClick={() => onCancelOrder(order.id)}
                           >
                             İptal Et
                           </Button>
                         </div>
                       )}

                       {['READY', 'DELIVERED', 'COMPLETED', 'PAID'].includes(order.status) && (
                         <div className="mt-4 pl-3">
                           <Button 
                             variant="outline"
                             size="sm"
                             className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
                             onClick={() => {
                               setSelectedOrderForReview(order);
                               setReviewDialogOpen(true);
                             }}
                           >
                             <MessageSquare className="w-4 h-4" />
                             {order.reviews && order.reviews.length > 0 ? 'Değerlendirmeyi Düzenle' : 'Değerlendir'}
                           </Button>
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              )}
             </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>

      <CreateReviewDialog 
        open={reviewDialogOpen} 
        onOpenChange={(open) => {
          setReviewDialogOpen(open);
          if (!open && onOrderSuccess) onOrderSuccess();
        }}
        orderId={selectedOrderForReview?.id || ''}
        items={selectedOrderForReview?.items || []}
        existingReviews={selectedOrderForReview?.reviews || []}
      />
    </Sheet>
  );
}