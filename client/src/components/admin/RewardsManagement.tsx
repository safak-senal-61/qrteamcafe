import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Gift, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { API_URL } from '@/lib/api';

interface Cafe {
  id: string;
  name: string;
  status: string;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  imageUrl: string;
  isActive: boolean;
}

interface RewardsManagementProps {
  cafes: Cafe[];
}

export function RewardsManagement({ cafes }: RewardsManagementProps) {
  const [selectedCafeId, setSelectedCafeId] = useState<string>('');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/loyalty/admin/rewards/${selectedCafeId}`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      }
    } catch {
      toast.error('Ödüller yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [selectedCafeId]);

  useEffect(() => {
    if (selectedCafeId) {
      fetchRewards();
    } else {
      setRewards([]);
    }
  }, [selectedCafeId, fetchRewards]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedCafeId) {
      toast.error('Lütfen önce işletme seçin');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Using the generic upload endpoint or creating a specific one if needed
      // Assuming we can use a general upload endpoint or reusing product image upload logic
      // For now, let's use a hypothetical rewards image upload endpoint
      const res = await fetch(`${API_URL}/loyalty/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const fullUrl = data.url.startsWith('http') ? data.url : `${API_URL}${data.url}`;
        setImageUrl(fullUrl);
        toast.success('Görsel yüklendi');
      } else {
        toast.error('Görsel yüklenemedi');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Yükleme hatası');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeId) return toast.error('Lütfen bir işletme seçin');
    
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/loyalty/rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: selectedCafeId,
          title,
          description,
          pointsCost: parseInt(pointsCost),
          imageUrl
        })
      });

      if (res.ok) {
        toast.success('Ödül eklendi');
        setTitle('');
        setDescription('');
        setPointsCost('');
        setImageUrl('');
        fetchRewards();
      } else {
        toast.error('Ekleme başarısız');
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ödülü silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`${API_URL}/loyalty/rewards/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Ödül silindi');
        fetchRewards();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Silme başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Hediye Kataloğu Yönetimi</CardTitle>
          <CardDescription>İşletme seçip hediye ekleyin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>İşletme Seçin</Label>
              <Select value={selectedCafeId} onValueChange={setSelectedCafeId}>
                <SelectTrigger>
                  <SelectValue placeholder="İşletme seçiniz..." />
                </SelectTrigger>
                <SelectContent>
                  {cafes.filter(c => c.status === 'APPROVED').map(cafe => (
                    <SelectItem key={cafe.id} value={cafe.id}>{cafe.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCafeId && (
              <form onSubmit={handleCreate} className="space-y-4 border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-white dark:bg-slate-950">
                <h3 className="font-medium flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Plus className="w-4 h-4" /> Yeni Ödül Ekle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ödül Adı</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Örn: Ücretsiz Kahve" />
                  </div>
                  <div className="space-y-2">
                    <Label>Puan Bedeli</Label>
                    <Input type="number" value={pointsCost} onChange={e => setPointsCost(e.target.value)} required placeholder="500" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Açıklama</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ödül detayları..." />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Ödül Görseli</Label>
                    <div className="flex items-center gap-4">
                      {imageUrl ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                          <Image 
                            src={imageUrl} 
                            alt="Preview" 
                            fill
                            className="object-cover" 
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploadingImage ? (
                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                          ) : (
                            <Upload className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                         <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           accept="image/*"
                           onChange={handleImageUpload}
                         />
                         <p className="text-sm text-slate-500">Cihazınızdan bir görsel seçin.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={creating} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Ödülü Ekle
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCafeId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
             <div className="col-span-full flex justify-center py-8"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>
          ) : rewards.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500 bg-white/50 dark:bg-slate-900/50 rounded-xl">Bu işletme için henüz ödül eklenmemiş.</div>
          ) : (
            rewards.map(reward => (
              <Card key={reward.id} className="relative overflow-hidden group border-none shadow-md hover:shadow-xl transition-all">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button variant="destructive" size="icon" className="h-8 w-8 shadow-lg" onClick={() => handleDelete(reward.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base truncate">{reward.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                     <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
                       {reward.imageUrl ? (
                         <Image
                           src={reward.imageUrl}
                           alt={reward.title}
                           fill
                           className="object-cover"
                           unoptimized
                         />
                       ) : (
                         <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                           <Gift className="h-6 w-6 opacity-50" />
                         </div>
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{reward.pointsCost} Puan</div>
                       <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{reward.description}</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
