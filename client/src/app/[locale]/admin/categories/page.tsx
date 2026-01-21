'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', sortOrder: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  const getCafeId = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr).cafeId;
  };

  const fetchCategories = async () => {
    const cafeId = getCafeId();
    if (!cafeId) return;

    try {
      const res = await fetch(`${API_URL}/categories?cafeId=${cafeId}`);
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (error) {
      toast.error('Kategoriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cafeId = getCafeId();
    if (!cafeId) return;

    try {
      const url = editingId 
        ? `${API_URL}/categories/${editingId}`
        : `${API_URL}/categories?cafeId=${cafeId}`;
      
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? 'Kategori güncellendi.' : 'Kategori eklendi.');
        fetchCategories();
        setIsDialogOpen(false);
        setFormData({ name: '', sortOrder: 0 });
        setEditingId(null);
      } else {
        toast.error('İşlem başarısız.');
      }
    } catch (error) {
      toast.error('Hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Kategori silindi.');
        fetchCategories();
      }
    } catch (error) {
      toast.error('Silme işlemi başarısız.');
    }
  };

  const quickCategories = [
    "Sıcak İçecekler",
    "Soğuk İçecekler",
    "Tatlılar",
    "Ana Yemekler",
    "Kahvaltılıklar",
    "Atıştırmalıklar",
    "Sandviçler",
    "Salatalar",
    "Makarnalar",
    "Burgerler"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Kategoriler</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData({ name: '', sortOrder: 0 }); }}>
              <Plus className="mr-2 h-4 w-4" /> Yeni Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Kategori Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Tatlılar"
                  required
                />
                
                {/* Hızlı Seçim Butonları */}
                {!editingId && (
                  <div className="pt-2">
                    <Label className="text-xs text-muted-foreground mb-2 block">Hızlı Seçim:</Label>
                    <div className="flex flex-wrap gap-2">
                      {quickCategories.map((cat) => (
                        <Button
                          key={cat}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setFormData({ ...formData, name: cat })}
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sıralama</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                />
              </div>
              <Button type="submit" className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kategori Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Sıralama</TableHead>
                  <TableHead>Ürün Sayısı</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>{category._count?.products || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingId(category.id);
                        setFormData({ name: category.name, sortOrder: category.sortOrder });
                        setIsDialogOpen(true);
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(category.id)}>
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
