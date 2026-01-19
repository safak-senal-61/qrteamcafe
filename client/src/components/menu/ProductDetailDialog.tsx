import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Minus, Plus, ShoppingBasket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Product, useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';

interface ProductDetailDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailDialog({ product, open, onOpenChange }: ProductDetailDialogProps) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuantity(1);
      setNote('');
    }
  }, [open]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product, note);
    }
    
    toast.success(`${quantity} adet ${product.name} sepete eklendi.`);
    onOpenChange(false);
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 gap-0 rounded-2xl" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>Ürün detayları ve sipariş notu ekleme</DialogDescription>
        </DialogHeader>

        <div className="relative h-64 w-full bg-secondary">
          <Image
            src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop'}
            alt={product.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <DialogClose className="absolute top-4 right-4 rounded-full bg-black/20 hover:bg-black/40 text-white p-2 transition-colors backdrop-blur-sm">
            <X className="h-5 w-5" />
            <span className="sr-only">Kapat</span>
          </DialogClose>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-2xl font-bold leading-tight mb-1">{product.name}</h2>
            <p className="text-white/90 font-medium">{Number(product.price).toFixed(2)} ₺</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Ürün Detayı</h4>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {product.description || 'Açıklama bulunmuyor.'}
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="note" className="text-base font-semibold">Sipariş Notu</Label>
            <Textarea
              id="note"
              placeholder="Örn: Acısız olsun, sosu bol olsun..."
              className="resize-none bg-secondary/30 min-h-[80px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3 bg-secondary/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold w-4 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={incrementQuantity}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              className="flex-1 ml-4 font-bold" 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <ShoppingBasket className="w-4 h-4 mr-2" />
              {(product.price * quantity).toFixed(2)} ₺ • Ekle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
