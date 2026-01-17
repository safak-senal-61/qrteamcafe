'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { API_URL } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    categoryId: '', 
    price: '', 
    description: '',
    imageUrl: '',
    isAvailable: true 
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);

  const getCafeId = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr).cafeId;
  };

  const fetchData = async () => {
    const cafeId = getCafeId();
    if (!cafeId) return;

    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${API_URL}/products?cafeId=${cafeId}`),
        fetch(`${API_URL}/categories?cafeId=${cafeId}`)
      ]);

      if (prodRes.ok && catRes.ok) {
        setProducts(await prodRes.json());
        setCategories(await catRes.json());
      }
    } catch (error) {
      toast.error('Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/products/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        toast.success('Resim yüklendi.');
      } else {
        toast.error('Resim yüklenemedi.');
      }
    } catch (error) {
      toast.error('Bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddPending = () => {
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast.error('Lütfen gerekli alanları doldurun.');
      return;
    }

    const category = categories.find(c => c.id === formData.categoryId);

    setPendingProducts([
      ...pendingProducts,
      { ...formData, id: Date.now().toString(), categoryName: category?.name }
    ]);

    // Formu temizle ama kategoriyi koru
    setFormData(prev => ({
      ...prev,
      name: '',
      price: '',
      description: '',
      imageUrl: '',
      // categoryId ve isAvailable korunur
    }));
    toast.success('Listeye eklendi.');
  };

  const removePending = (id: string) => {
    setPendingProducts(pendingProducts.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cafeId = getCafeId();
    if (!cafeId) return;

    try {
      if (editingId) {
        if (!formData.name || !formData.price) {
          toast.error('Lütfen ad ve fiyat alanlarını doldurun.');
          return;
        }

        const res = await fetch(`${API_URL}/products/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            price: parseFloat(formData.price),
          }),
        });

        if (res.ok) {
          toast.success('Ürün güncellendi.');
          fetchData();
          setIsDialogOpen(false);
          resetForm();
        } else {
          const error = await res.json();
          toast.error(error.message || 'İşlem başarısız.');
        }
      } else {
        // Yeni Ekleme (Tekli veya Çoklu)
        let productsToSave = [...pendingProducts];

        // Eğer formda doldurulmuş geçerli veri varsa onu da listeye dahil et
        if (formData.name && formData.price && formData.categoryId) {
           productsToSave.push({ 
             ...formData, 
             id: Date.now().toString(), // id gerekli olabilir
             categoryName: categories.find(c => c.id === formData.categoryId)?.name 
           });
        } else if (productsToSave.length === 0) {
           // Eğer liste boşsa ve form da eksikse uyarı ver
           toast.error('Lütfen eklenecek ürün girin veya mevcut formu doldurun.');
           return;
        }

        const promises = productsToSave.map(product => {
          return fetch(`${API_URL}/products?cafeId=${cafeId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: product.name,
              categoryId: product.categoryId,
              price: parseFloat(product.price),
              description: product.description,
              imageUrl: product.imageUrl,
              isAvailable: product.isAvailable,
            }),
          });
        });

        await Promise.all(promises);
        toast.success(`${productsToSave.length} ürün eklendi.`);
        fetchData();
        setIsDialogOpen(false);
        setPendingProducts([]);
        resetForm();
      }
    } catch (error) {
      toast.error('Hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
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

  const resetForm = () => {
    setFormData({ 
      name: '', 
      categoryId: '', 
      price: '', 
      description: '',
      imageUrl: '',
      isAvailable: true 
    });
    setEditingId(null);
  };

  const getCategoryExamples = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return [];

    const name = category.name.toLowerCase();
    
    if (name.includes('sıcak') || name.includes('çay') || name.includes('kahve')) {
      return ['Çay', 'Türk Kahvesi', 'Latte', 'Cappuccino', 'Sıcak Çikolata', 'Bitki Çayı', 'Filtre Kahve'];
    }
    if (name.includes('soğuk') || name.includes('kola') || name.includes('su') || name.includes('meşrubat')) {
      return ['Su', 'Kola', 'Fanta', 'Ayran', 'Limonata', 'Soğuk Kahve', 'Meyve Suyu', 'Ice Tea', 'Soda'];
    }
    if (name.includes('tatlı') || name.includes('pasta')) {
      return ['Magnolia', 'Cheesecake', 'Tiramisu', 'Sütlaç', 'Trileçe', 'Baklava', 'San Sebastian', 'Waffle', 'Dondurma'];
    }
    if (name.includes('yemek') || name.includes('ızgara') || name.includes('tavuk') || name.includes('köfte') || name.includes('ana')) {
      return ['Köfte', 'Tavuk Izgara', 'Hamburger', 'Cheeseburger', 'Pizza', 'Makarna', 'Mantı', 'Çökertme'];
    }
    if (name.includes('kahvaltı') || name.includes('tost') || name.includes('omlet')) {
      return ['Serpme Kahvaltı', 'Kahvaltı Tabağı', 'Menemen', 'Omlet', 'Kaşarlı Tost', 'Karışık Tost', 'Sucuklu Yumurta'];
    }
    if (name.includes('atıştırma') || name.includes('cips') || name.includes('börek') || name.includes('ara')) {
      return ['Patates Kızartması', 'Soğan Halkası', 'Sigara Böreği', 'Sosis Tabağı', 'Çıtır Tavuk', 'Nugget'];
    }
    if (name.includes('nargile')) {
      return ['Elma', 'Nane', 'Kavun', 'Çilek', 'Love 66', 'Lady Killer', 'Üzüm', 'Yaban Mersini'];
    }
    if (name.includes('salata')) {
      return ['Sezar Salata', 'Ton Balıklı Salata', 'Çoban Salata', 'Mevsim Salata', 'Hellim Salata'];
    }
    if (name.includes('makarna')) {
      return ['Penne Arrabbiata', 'Fettuccine Alfredo', 'Spaghetti Bolognese', 'Mantı'];
    }
    if (name.includes('burger')) {
      return ['Hamburger', 'Cheeseburger', 'Tavuk Burger', 'Steak Burger'];
    }
    
    return [];
  };

  const selectedCategoryExamples = getCategoryExamples(formData.categoryId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Ürünler</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Yeni Ürün
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8 space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-4 flex items-end">
                  <div className="flex items-center justify-between space-x-2 border p-2 rounded-md w-full h-10 bg-muted/20">
                    <Label htmlFor="isAvailable" className="text-xs">Satışa Açık</Label>
                    <Switch
                      id="isAvailable"
                      checked={formData.isAvailable}
                      onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ürün Adı</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Çay"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Fiyat (₺)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Hızlı Seçim Butonları */}
              {selectedCategoryExamples.length > 0 && !editingId && (
                <div className="bg-secondary/20 p-3 rounded-lg border border-dashed">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Hızlı Seçim ({categories.find(c => c.id === formData.categoryId)?.name}):
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategoryExamples.map((item) => (
                      <Button
                        key={item}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => setFormData({ ...formData, name: item })}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="İsteğe bağlı açıklama"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Resim</Label>
                  <div className="flex items-center gap-2">
                    {formData.imageUrl && (
                      <div className="relative h-10 w-10 rounded-md overflow-hidden border">
                        <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Label 
                        htmlFor="image-upload" 
                        className="flex items-center justify-center w-full h-10 border border-dashed rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Upload className="h-4 w-4" />
                            <span className="text-xs">Yükle</span>
                          </div>
                        )}
                        <Input 
                          id="image-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileChange}
                          disabled={uploading}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Eklenen Ürünler Listesi */}
              {!editingId && pendingProducts.length > 0 && (
                <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                  <Label className="text-sm font-medium">Eklenecek Ürünler ({pendingProducts.length})</Label>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {pendingProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm p-2 bg-background rounded border">
                        <div className="flex flex-col">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.categoryName} - ₺{p.price}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={() => removePending(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 sticky bottom-0 bg-background border-t">
                {!editingId && (
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="flex-1"
                    onClick={handleAddPending}
                    disabled={!formData.name || !formData.price || !formData.categoryId}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Listeye Ekle
                  </Button>
                )}
                <Button type="submit" className="flex-1">
                  {editingId 
                    ? 'Güncelle' 
                    : pendingProducts.length > 0 
                      ? `Hepsini Kaydet (${pendingProducts.length})` 
                      : 'Kaydet'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ürün Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resim</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category?.name || '-'}</TableCell>
                    <TableCell>₺{Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.isAvailable ? 'Aktif' : 'Pasif'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingId(product.id);
                        setFormData({ 
                          name: product.name, 
                          categoryId: product.categoryId, 
                          price: product.price, 
                          description: product.description || '',
                          imageUrl: product.imageUrl || '',
                          isAvailable: product.isAvailable
                        });
                        setIsDialogOpen(true);
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
