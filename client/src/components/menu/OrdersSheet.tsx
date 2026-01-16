import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Clock, CheckCircle2, XCircle, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrdersSheetProps {
  orders: any[];
  onCancel: (orderId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function OrdersSheet({ orders, onCancel, open, onOpenChange }: OrdersSheetProps) {
  // Show active count (not cancelled, not paid)
  const activeCount = orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'PAID').length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <div className="fixed bottom-6 left-6 z-50">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              size="lg"
              variant="secondary"
              className="h-16 w-16 rounded-full shadow-2xl relative border-4 border-white ring-2 ring-secondary/20"
            >
              <ClipboardList className="h-7 w-7" />
              <AnimatePresence>
                {activeCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                  >
                    {activeCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            Siparişlerim
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] pr-4">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center">
              <ClipboardList className="w-12 h-12 mb-4 opacity-20" />
              <p>Henüz siparişiniz bulunmuyor.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
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
                        {
                          order.status === 'PENDING' ? <><Clock className="w-3 h-3 mr-1" /> Bekliyor</> :
                          order.status === 'PREPARING' ? <><ChefHat className="w-3 h-3 mr-1" /> Hazırlanıyor</> :
                          order.status === 'READY' ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Hazır</> :
                          order.status === 'DELIVERED' ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Teslim Edildi</> : 
                          order.status === 'CANCELLED' ? <><XCircle className="w-3 h-3 mr-1" /> İptal Edildi</> : order.status
                        }
                     </Badge>
                   </div>
                   
                   <div className="space-y-2 mb-4 pl-3">
                     {order.items?.map((item: any, idx: number) => (
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

                   {order.status === 'PENDING' && (
                     <div className="mt-4 pl-3">
                       <Button 
                         variant="destructive" 
                         size="sm" 
                         className="w-full"
                         onClick={() => onCancel(order.id)}
                       >
                         Siparişi İptal Et
                       </Button>
                     </div>
                   )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
