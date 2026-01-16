'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  BarChart3, 
  PieChart,
  Calendar,
  Plus,
  Minus,
  Search
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DashboardStats {
  totalOrders: number;
  dailyRevenue: number;
  activeTables: number;
  totalProducts: number;
  recentOrders: any[];
  popularProducts: any[];
}

interface Category {
  id: string;
  name: string;
  products: any[];
  productCount?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string;
  category?: Category;
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Management State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAmount, setStockAmount] = useState<string>('');
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);
    const cafeId = user.cafeId;

    try {
      const [statsRes, catRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/cafes/my-stats?cafeId=${cafeId}`),
        fetch(`${API_URL}/categories?cafeId=${cafeId}`),
        fetch(`${API_URL}/products?cafeId=${cafeId}`)
      ]);

      if (statsRes.ok && catRes.ok && prodRes.ok) {
        const statsData = await statsRes.json();
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        
        setStats(statsData);
        setCategories(catData);
        setProducts(prodData);
      } else {
        toast.error('Veriler yüklenemedi.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStock = async (isAdding: boolean) => {
    if (!selectedProduct || !stockAmount) return;
    
    const quantity = parseInt(stockAmount);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Geçerli bir miktar giriniz.');
      return;
    }

    const finalQuantity = isAdding ? quantity : -quantity;

    try {
      const res = await fetch(`${API_URL}/products/${selectedProduct.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: finalQuantity })
      });
      
      if (res.ok) {
        toast.success(`Stok ${isAdding ? 'eklendi' : 'düşüldü'}.`);
        await fetchData(); // Refresh data
        setIsStockDialogOpen(false);
        setStockAmount('');
        setSelectedProduct(null);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Stok güncellenemedi.');
      }
    } catch (e) {
      toast.error('Bağlantı hatası.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate some derived stats
  const totalStock = products.length; // This is actually product count, logic might need adjustment if total items in stock is needed
  // Calculate total items in stock (sum of all product stocks)
  const totalItemsInStock = products.reduce((acc, prod) => acc + (prod.stock || 0), 0);

  // Calculate category product counts using the products array
  const categoryCounts = categories.map(cat => {
    const count = products.filter(p => p.categoryId === cat.id).length;
    return { ...cat, productCount: count };
  });
  
  const maxProductCount = Math.max(...categoryCounts.map(c => c.productCount || 0), 1);
  const maxPopularity = Math.max(...stats.popularProducts.map((p: any) => p._count?.orderItems || 0), 1);

  // Filter products for stock table
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel</h2>
          <p className="text-muted-foreground">
            İstatistikler ve Stok Yönetimi
          </p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stats">İstatistikler</TabsTrigger>
          <TabsTrigger value="stocks">Stok Yönetimi</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Ürün Çeşidi</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalStock}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Toplam {totalItemsInStock} adet stok
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Günlük Ciro</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">₺{Number(stats.dailyRevenue).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  Bugünkü kazanç
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Sipariş</CardTitle>
                <ShoppingBag className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tüm zamanlar
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Kategori Sayısı</CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{categories.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aktif menü başlığı
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Popular Products Chart */}
            <Card className="col-span-4 border-none shadow-sm">
              <CardHeader>
                <CardTitle>En Çok Satan Ürünler</CardTitle>
                <CardDescription>
                  Sipariş sayılarına göre popüler ürünler.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.popularProducts.map((product: any, i) => {
                    const count = product._count?.orderItems || 0;
                    const percentage = (count / maxPopularity) * 100;
                    
                    return (
                      <div key={product.id} className="space-y-1 group">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground w-4 text-xs">{i + 1}.</span>
                            <span className="font-medium">{product.name}</span>
                          </div>
                          <span className="text-muted-foreground text-xs">{count} sipariş</span>
                        </div>
                        <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000 ease-out rounded-full group-hover:bg-primary/80"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {stats.popularProducts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Henüz veri yok.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="col-span-3 border-none shadow-sm">
              <CardHeader>
                <CardTitle>Kategori Dağılımı</CardTitle>
                <CardDescription>
                  Kategorilere göre ürün sayıları.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryCounts.map((cat) => {
                    const count = cat.productCount || 0;
                    const percentage = (count / maxProductCount) * 100;

                    return (
                      <div key={cat.id} className="flex items-center justify-between text-sm p-2 hover:bg-secondary/50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <PieChart className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stocks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stok Yönetimi</CardTitle>
                  <CardDescription>Ürünlerin stok durumunu görüntüleyin ve güncelleyin.</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Ürün veya kategori ara..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün Adı</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Fiyat</TableHead>
                      <TableHead className="text-center">Mevcut Stok</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                          Ürün bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map(product => (
                        <TableRow 
                          key={product.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedProduct(product);
                            setStockAmount('');
                            setIsStockDialogOpen(true);
                          }}
                        >
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category?.name}</TableCell>
                          <TableCell>{Number(product.price).toFixed(2)} ₺</TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (product.stock || 0) <= 5 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {product.stock || 0} Adet
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              Stok İşlemi
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Update Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Stok Güncelleme</DialogTitle>
            <DialogDescription>
              <span className="font-bold text-foreground">{selectedProduct?.name}</span> için stok ekleyin veya çıkarın.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-stock" className="text-right">
                Mevcut
              </Label>
              <div className="col-span-3 font-mono font-bold text-lg">
                {selectedProduct?.stock || 0} Adet
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Miktar
              </Label>
              <div className="col-span-3 space-y-3">
                <Input
                  id="amount"
                  type="number"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  placeholder="Örn: 10"
                  autoFocus
                />
                <div className="flex gap-2 flex-wrap">
                  {[5, 10, 20, 50, 100].map(amount => (
                    <Button 
                      key={amount} 
                      type="button"
                      variant="outline" 
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setStockAmount(amount.toString())}
                    >
                      +{amount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => handleUpdateStock(false)}
              className="flex-1"
            >
              <Minus className="mr-2 h-4 w-4" /> Stok Düş
            </Button>
            <Button 
              type="button" 
              onClick={() => handleUpdateStock(true)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Stok Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}