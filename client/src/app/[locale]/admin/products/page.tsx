"use client"

import { useState, useEffect, useCallback } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  GripVertical, 
  Search, 
  Image as ImageIcon,
  Loader2,
  MoreVertical,
  X,
  Star,
  Package,
  List
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CATEGORY_SUGGESTIONS, getProductSuggestions } from '@/constants/menu-suggestions';

interface Category {
  id: string;
  name: string;
  sortOrder?: number;
  _count?: {
    products: number;
  };
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  description?: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  isChefRecommended: boolean;
  requiresPreparation: boolean;
  sortOrder?: number;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // All products
  const [viewProducts, setViewProducts] = useState<Product[]>([]); // Displayed products
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog States
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  
  // Edit States
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form States
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    originalPrice: '',
    stock: '',
    description: '',
    imageUrl: '',
    isAvailable: true,
    isChefRecommended: false,
    requiresPreparation: true
  });
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const cafeId = user.cafeId;

      const [catsRes, prodsRes] = await Promise.all([
        fetch(`${API_URL}/categories?cafeId=${cafeId}`),
        fetch(`${API_URL}/products?cafeId=${cafeId}`)
      ]);

      if (catsRes.ok && prodsRes.ok) {
        const cats = await catsRes.json();
        const prods = await prodsRes.json();
        
        // Sort categories by sortOrder
        cats.sort((a: Category, b: Category) => (a.sortOrder || 0) - (b.sortOrder || 0));
        
        setCategories(cats);
        setProducts(prods);

        // Select first category by default if none selected
        if (!selectedCategoryId && cats.length > 0) {
          setSelectedCategoryId(cats[0].id);
        }
      }
    } catch {
      toast.error('Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter products when category or search changes
  useEffect(() => {
    let filtered = [...products];

    if (selectedCategoryId) {
      filtered = filtered.filter(p => p.categoryId === selectedCategoryId);
      // Sort by sortOrder
      filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setViewProducts(filtered);
  }, [products, selectedCategoryId, searchTerm]);

  // --- Category Actions ---

  const handleCategoryReorder = (newOrder: Category[]) => {
    setCategories(newOrder);
  };

  // Trigger save when drag ends (using a timeout to debounce/wait for drop)
  // Since Framer Motion's onReorder triggers every frame, we need a way to know when it ends.
  // We can use onDragEnd on the Reorder.Item, but easier is to just save on every change with debounce?
  // Or just provide a "Save Order" button? No, user wants "less manual".
  // Let's use a simple debounce effect on `categories`.
  useEffect(() => {
    const saveCategoryOrder = async () => {
      try {
        const items = categories.map((cat, index) => ({
          id: cat.id,
          sortOrder: index
        }));
        
        await fetch(`${API_URL}/categories/reorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items)
        });
        // Silent success or optional toast
      } catch {
        toast.error('Sıralama kaydedilemedi.');
      }
    };

    const timer = setTimeout(() => {
      if (categories.length > 0) saveCategoryOrder();
    }, 1000);
    return () => clearTimeout(timer);
  }, [categories]);


  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const cafeId = user.cafeId;

      const url = editingCategory 
        ? `${API_URL}/categories/${editingCategory.id}`
        : `${API_URL}/categories?cafeId=${cafeId}`;
      
      const method = editingCategory ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });

      if (res.ok) {
        toast.success(editingCategory ? 'Kategori güncellendi' : 'Kategori eklendi');
        setIsCategoryDialogOpen(false);
        setEditingCategory(null);
        setCategoryForm({ name: '' });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.message || 'İşlem başarısız.');
      }
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Kategoriyi ve içindeki ürünleri silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Kategori silindi.');
        if (selectedCategoryId === id) setSelectedCategoryId(null);
        fetchData();
      }
    } catch (_error) {
      console.error(_error);
      toast.error('Silme işlemi başarısız.');
    }
  };

  // --- Product Actions ---

  const handleProductReorder = (newOrder: Product[]) => {
    // Optimistically update sortOrder in the objects
    const updatedOrder = newOrder.map((item, index) => ({
      ...item,
      sortOrder: index
    }));
    
    setViewProducts(updatedOrder);

    // Update main products state to preserve order when switching categories
    if (!searchTerm && selectedCategoryId) {
      setProducts(prev => {
        const otherProducts = prev.filter(p => p.categoryId !== selectedCategoryId);
        return [...otherProducts, ...updatedOrder];
      });
    }
  };

  // Save product order when viewProducts changes (and we are in a category view)
  useEffect(() => {
    if (!selectedCategoryId || searchTerm) return; // Only reorder when viewing a specific category without search
    
    const timer = setTimeout(async () => {
      if (viewProducts.length > 0) {
        try {
          const items = viewProducts.map((prod, index) => ({
            id: prod.id,
            sortOrder: index
          }));
          
          await fetch(`${API_URL}/products/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
          });
        } catch (error) {
          console.error(error);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [viewProducts, selectedCategoryId, searchTerm]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const cafeId = user.cafeId;

      const price = parseFloat(productForm.price);
      const originalPrice = productForm.originalPrice ? parseFloat(productForm.originalPrice) : null;

      if (originalPrice !== null) {
        if (originalPrice < 0) {
          toast.error('İndirimsiz fiyat 0\'dan küçük olamaz.');
          return;
        }
        if (originalPrice < price) {
          toast.error('İndirimsiz fiyat, satış fiyatından küçük olamaz.');
          return;
        }
      }

      const url = editingProduct 
        ? `${API_URL}/products/${editingProduct.id}`
        : `${API_URL}/products?cafeId=${cafeId}`;
      
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          price,
          originalPrice,
          stock: parseInt(productForm.stock) || 0,
          isChefRecommended: productForm.isChefRecommended,
          requiresPreparation: productForm.requiresPreparation
        })
      });

      if (res.ok) {
        toast.success(editingProduct ? 'Ürün güncellendi' : 'Ürün eklendi');
        setIsProductDialogOpen(false);
        setEditingProduct(null);
        resetProductForm();
        fetchData();
      }
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Ürün silindi.');
        fetchData();
      }
    } catch (_error) {
      console.error(_error);
      toast.error('Silme işlemi başarısız.');
    }
  };

  const handleToggleRecommended = async (product: Product) => {
    try {
      const updatedProducts = products.map(p =>  
        p.id === product.id ? { ...p, isChefRecommended: !p.isChefRecommended } : p
      );
      setProducts(updatedProducts);

      await fetch(`${API_URL}/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChefRecommended: !product.isChefRecommended })
      });
      toast.success(product.isChefRecommended ? 'Önerilenlerden çıkarıldı' : 'Önerilenlere eklendi');
    } catch {
      toast.error('Güncelleme başarısız');
      fetchData();
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      // Optimistic update
      const updatedProducts = products.map(p => 
        p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p
      );
      setProducts(updatedProducts);

      await fetch(`${API_URL}/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !product.isAvailable })
      });
      toast.success('Durum güncellendi');
    } catch (_error) {
      console.error(_error);
      toast.error('Güncelleme başarısız');
      fetchData(); // Revert
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/products/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setProductForm(prev => ({ ...prev, imageUrl: data.url }));
    } catch (_error) {
      console.error(_error);
      toast.error('Resim yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      categoryId: selectedCategoryId || '',
      price: '',
      originalPrice: '',
      stock: '',
      description: '',
      imageUrl: '',
      isAvailable: true,
      isChefRecommended: false,
      requiresPreparation: true
    });
  };

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        categoryId: product.categoryId,
        price: product.price.toString(),
        originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
        stock: product.stock !== undefined ? product.stock.toString() : '0',
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        isAvailable: product.isAvailable,
        isChefRecommended: product.isChefRecommended || false,
        requiresPreparation: product.requiresPreparation !== undefined ? product.requiresPreparation : true
      });
    } else {
      setEditingProduct(null);
      resetProductForm();
    }
    setIsProductDialogOpen(true);
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const CategoryList = ({ isMobile }: { isMobile?: boolean }) => (
    <div className={cn("flex flex-col gap-4 h-full", isMobile && "h-auto")}>
      <div className="flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-lg">Kategoriler</h3>
        <Button size="sm" variant="outline" onClick={() => {
          setEditingCategory(null);
          setCategoryForm({ name: '' });
          setIsCategoryDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-1" /> Ekle
        </Button>
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        <Reorder.Group axis="y" values={categories} onReorder={handleCategoryReorder} className="space-y-2">
          {categories.map((category) => (
            <Reorder.Item key={category.id} value={category}>
              <div 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm transition-all cursor-pointer hover:border-primary/50 group",
                  selectedCategoryId === category.id && "border-primary bg-primary/5"
                )}
                onClick={() => setSelectedCategoryId(category.id)}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category._count?.products || 0}
                  </Badge>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingCategory(category);
                      setCategoryForm({ name: category.name });
                      setIsCategoryDialogOpen(true);
                    }}>
                      <Pencil className="mr-2 h-4 w-4" /> Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCategory(category.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        
        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            Henüz kategori yok.
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menü Yönetimi</h2>
          <p className="text-muted-foreground text-sm">
            Kategorileri ve ürünleri düzenleyin.
          </p>
        </div>
        
        {/* Mobile Actions */}
        <div className="flex items-center gap-2 lg:hidden self-end sm:self-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <List className="mr-2 h-4 w-4" /> Kategorileri Yönet
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-4">
              <SheetHeader className="mb-4 text-left">
                <SheetTitle>Kategori Yönetimi</SheetTitle>
                <SheetDescription>
                  Sürükleyip bırakarak sıralamayı değiştirebilirsiniz.
                </SheetDescription>
              </SheetHeader>
              <CategoryList isMobile={true} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-1/4 min-w-[250px] h-full">
          <CategoryList />
        </div>

        {/* Mobile Category Selection (Horizontal Scroll) */}
        <div className="lg:hidden shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0">
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={selectedCategoryId === cat.id ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-sm py-1.5 px-4 transition-all hover:bg-primary/90 hover:text-primary-foreground",
                    selectedCategoryId === cat.id ? "shadow-md" : "bg-background"
                  )}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  {cat.name} ({cat._count?.products || 0})
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Products Main Area */}
        <div className="flex-1 flex flex-col gap-4 bg-muted/10 rounded-xl border p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0">
            <div className="relative flex-1 max-w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürünlerde ara..."
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => openProductDialog()} disabled={!selectedCategoryId} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Ürün Ekle
            </Button>
          </div>

          <ScrollArea className="flex-1 -mr-3 pr-3">
            {selectedCategoryId ? (
              <Reorder.Group axis="y" values={viewProducts} onReorder={handleProductReorder} className="space-y-2 pb-4">
                <AnimatePresence initial={false}>
                  {viewProducts.map((product) => (
                    <Reorder.Item key={product.id} value={product} dragListener={!searchTerm}>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-md transition-all group relative"
                      >
                        {!searchTerm && (
                          <div className="absolute top-2 right-2 sm:static sm:block">
                             <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="h-16 w-16 sm:h-12 sm:w-12 rounded-md bg-secondary shrink-0 overflow-hidden relative">
                            {product.imageUrl ? (
                              <Image 
                                src={product.imageUrl} 
                                alt={product.name} 
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 sm:h-5 sm:w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 sm:hidden">
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate">{product.name}</h4>
                                {!product.isAvailable && (
                                  <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Pasif</Badge>
                                )}
                            </div>
                            <div className="text-sm font-semibold text-primary">
                                {product.price} ₺
                                {product.originalPrice && (
                                  <span className="ml-2 text-xs text-muted-foreground line-through decoration-destructive/50">
                                    {product.originalPrice} ₺
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 hidden sm:block">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{product.name}</h4>
                            {!product.isAvailable && (
                              <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Pasif</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate max-w-[300px]">{product.description}</p>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto mt-2 sm:mt-0 gap-4 shrink-0">
                          <div className="flex items-center gap-2 sm:hidden">
                             {/* Mobile description or extra info if needed, keeping it simple */}
                          </div>

                          <div className="flex items-center gap-4 ml-auto sm:ml-0">
                            <div className="text-right hidden sm:block">
                              <div className="font-semibold text-primary">{product.price} ₺</div>
                              {product.originalPrice && (
                                <div className="text-xs text-muted-foreground line-through decoration-destructive/50">
                                  {product.originalPrice} ₺
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8", product.isChefRecommended ? "text-yellow-500" : "text-muted-foreground")}
                                onClick={() => handleToggleRecommended(product)}
                                title="Şefin Tavsiyesi"
                              >
                                <Star className={cn("h-4 w-4", product.isChefRecommended && "fill-current")} />
                              </Button>
                              
                              <Switch 
                                checked={product.isAvailable}
                                onCheckedChange={() => handleToggleAvailability(product)}
                                className="scale-75"
                              />

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openProductDialog(product)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Düzenle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProduct(product.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Sil
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Package className="h-12 w-12 opacity-20" />
                <p>Lütfen ürünleri görüntülemek için bir kategori seçin.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>



      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</DialogTitle>
            <DialogDescription className="hidden">
              Kategori bilgilerini giriniz.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div className="space-y-2">
              <Label>Kategori Adı</Label>
              <Input 
                value={categoryForm.name} 
                onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Örn: Tatlılar"
                required
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORY_SUGGESTIONS.filter(suggestion => 
                  !categories.some(c => c.name.toLowerCase() === suggestion.toLowerCase())
                ).map(suggestion => (
                  <Badge 
                    key={suggestion} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => setCategoryForm({ ...categoryForm, name: suggestion })}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>{editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}</DialogTitle>
          <DialogDescription className="hidden">
            Ürün detaylarını giriniz.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select 
                    value={productForm.categoryId} 
                    onValueChange={val => setProductForm({ ...productForm, categoryId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ürün Adı</Label>
                  <Input 
                    value={productForm.name} 
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                  {productForm.categoryId && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {getProductSuggestions(categories.find(c => c.id === productForm.categoryId)?.name || '').map(suggestion => (
                        <Badge 
                          key={suggestion} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-secondary transition-colors"
                          onClick={() => setProductForm({ ...productForm, name: suggestion })}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Satış Fiyatı (₺)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      step="0.01" 
                      value={productForm.price} 
                      onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>İndirimsiz Fiyat (Opsiyonel)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      step="0.01" 
                      value={productForm.originalPrice} 
                      onChange={e => setProductForm({ ...productForm, originalPrice: e.target.value })}
                      placeholder="İndirim yoksa boş bırakın"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Stok Adedi</Label>
                    <Input 
                      type="number" 
                      min="0"
                      value={productForm.stock} 
                      onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border p-3 rounded-lg">
                  <Label>Satışa Açık</Label>
                  <Switch 
                    checked={productForm.isAvailable} 
                    onCheckedChange={checked => setProductForm({ ...productForm, isAvailable: checked })}
                  />
                </div>

                <div className="flex items-center justify-between border p-3 rounded-lg">
                  <Label>Şefin Önerisi</Label>
                  <Switch 
                    checked={productForm.isChefRecommended} 
                    onCheckedChange={checked => setProductForm({ ...productForm, isChefRecommended: checked })}
                  />
                </div>

                <div className="flex items-center justify-between border p-3 rounded-lg">
                  <Label>Mutfak Hazırlığı Gerektirir</Label>
                  <Switch 
                    checked={productForm.requiresPreparation} 
                    onCheckedChange={checked => setProductForm({ ...productForm, requiresPreparation: checked })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Textarea 
                    value={productForm.description} 
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    className="h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ürün Görseli</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 relative h-40 bg-muted/5 hover:bg-muted/10 transition-colors">
                    {productForm.imageUrl ? (
                      <>
                        <div className="relative h-full w-full">
                          <Image 
                            src={productForm.imageUrl} 
                            alt="Preview" 
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                        <Button 
                          type="button"  
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => setProductForm({ ...productForm, imageUrl: '' })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">Resim yüklemek için tıklayın</span>
                      </>
                    )}
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-background shrink-0">
            <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>İptal</Button>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
