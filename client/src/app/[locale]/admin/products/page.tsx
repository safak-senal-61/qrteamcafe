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
  Check,
  X,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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

export default function MenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); // All products
  const [viewProducts, setViewProducts] = useState<any[]>([]); // Displayed products
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog States
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  
  // Edit States
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

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
    isChefRecommended: false
  });
  const [uploading, setUploading] = useState(false);

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, []);

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

  const fetchData = async () => {
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
        cats.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
        
        setCategories(cats);
        setProducts(prods);

        // Select first category by default if none selected
        if (!selectedCategoryId && cats.length > 0) {
          setSelectedCategoryId(cats[0].id);
        }
      }
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // --- Category Actions ---

  const handleCategoryReorder = (newOrder: any[]) => {
    setCategories(newOrder);
  };

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
    } catch (error) {
      toast.error('Sıralama kaydedilemedi.');
    }
  };

  // Trigger save when drag ends (using a timeout to debounce/wait for drop)
  // Since Framer Motion's onReorder triggers every frame, we need a way to know when it ends.
  // We can use onDragEnd on the Reorder.Item, but easier is to just save on every change with debounce?
  // Or just provide a "Save Order" button? No, user wants "less manual".
  // Let's use a simple debounce effect on `categories`.
  useEffect(() => {
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
      }
    } catch (error) {
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
    } catch (error) {
      toast.error('Silme işlemi başarısız.');
    }
  };

  // --- Product Actions ---

  const handleProductReorder = (newOrder: any[]) => {
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

      const url = editingProduct 
        ? `${API_URL}/products/${editingProduct.id}`
        : `${API_URL}/products?cafeId=${cafeId}`;
      
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : null,
          stock: parseInt(productForm.stock) || 0,
          isChefRecommended: productForm.isChefRecommended
        })
      });

      if (res.ok) {
        toast.success(editingProduct ? 'Ürün güncellendi' : 'Ürün eklendi');
        setIsProductDialogOpen(false);
        setEditingProduct(null);
        resetProductForm();
        fetchData();
      }
    } catch (error) {
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
    } catch (error) {
      toast.error('Silme işlemi başarısız.');
    }
  };

  const handleToggleAvailability = async (product: any) => {
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
    } catch (error) {
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
    } catch (error) {
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
      isChefRecommended: false
    });
  };

  const openProductDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        categoryId: product.categoryId,
        price: product.price,
        originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
        stock: product.stock !== undefined ? product.stock.toString() : '0',
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        isAvailable: product.isAvailable,
        isChefRecommended: product.isChefRecommended || false
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

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menü Yönetimi</h2>
          <p className="text-muted-foreground text-sm">
            Kategorileri ve ürünleri sürükleyip bırakarak düzenleyebilirsiniz.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Mobile view might need adjustment, keeping simple for now */}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Categories Sidebar */}
        <div className="w-1/3 md:w-1/4 flex flex-col gap-4 min-w-[250px]">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="font-semibold">Kategoriler</h3>
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

        {/* Products Main Area */}
        <div className="flex-1 flex flex-col gap-4 bg-muted/10 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-4 shrink-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürünlerde ara..."
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => openProductDialog()} disabled={!selectedCategoryId}>
              <Plus className="mr-2 h-4 w-4" /> Ürün Ekle
            </Button>
          </div>

          <ScrollArea className="flex-1 pr-4">
            {selectedCategoryId ? (
              <Reorder.Group axis="y" values={viewProducts} onReorder={handleProductReorder} className="space-y-2">
                <AnimatePresence initial={false}>
                  {viewProducts.map((product) => (
                    <Reorder.Item key={product.id} value={product} dragListener={!searchTerm}>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-md transition-all group"
                      >
                        {!searchTerm && (
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        )}
                        
                        <div className="h-12 w-12 rounded-md bg-secondary shrink-0 overflow-hidden relative">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{product.name}</h4>
                            {!product.isAvailable && (
                              <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Pasif</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{product.description}</p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="flex flex-col items-end">
                            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                              <div className="text-xs text-muted-foreground line-through tabular-nums">
                                ₺{Number(product.originalPrice).toFixed(2)}
                              </div>
                            )}
                            <div className={cn("font-semibold tabular-nums", product.originalPrice && Number(product.originalPrice) > Number(product.price) && "text-green-600")}>
                              ₺{Number(product.price).toFixed(2)}
                            </div>
                            <div className={cn("text-xs font-medium px-1.5 py-0.5 rounded", product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                              {product.stock} adet
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 border rounded-md p-1 bg-background">
                             <Switch 
                                checked={product.isAvailable} 
                                onCheckedChange={() => handleToggleAvailability(product)}
                                className="scale-75"
                             />
                          </div>

                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openProductDialog(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Ürünleri görmek için bir kategori seçin.</p>
              </div>
            )}
            
            {selectedCategoryId && viewProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Bu kategoride ürün bulunamadı.
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
                {CATEGORY_SUGGESTIONS.map(suggestion => (
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}</DialogTitle>
            <DialogDescription className="hidden">
              Ürün detaylarını giriniz.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-6">
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
                        <img src={productForm.imageUrl} alt="Preview" className="h-full w-full object-contain" />
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>İptal</Button>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
