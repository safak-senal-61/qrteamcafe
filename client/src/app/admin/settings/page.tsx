'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Save, Store, User, Settings2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Identity
    name: '',
    type: 'cafe', // restaurant, cafe, patisserie, other
    city: '',
    district: '',
    address: '',
    description: '',
    
    // Authorized Person
    authorizedPerson: '',
    phone: '',
    email: '',
    website: '',

    // Operational Info
    serviceType: 'both', // table, package, both
    workingHours: '',
    preparationTime: '15',
    paymentMethods: [] as string[],
    logoUrl: '',
    googleMapsUrl: '',
    createdAt: '',
  });

  const paymentOptions = [
    { id: 'cash', label: 'Nakit' },
    { id: 'credit_card', label: 'Kredi Kartı' },
    { id: 'ticket', label: 'Yemek Kartı (Sodexo, Multinet vb.)' },
    { id: 'online', label: 'Online Ödeme' },
  ];

  const getCafeId = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr).cafeId;
  };

  const fetchCafe = async () => {
    const cafeId = getCafeId();
    if (!cafeId) return;

    try {
      const res = await fetch(`${API_URL}/cafes/${cafeId}`);
      if (res.ok) {
        const data = await res.json();
        
        // Parse payment methods from string if necessary
        let methods = [];
        try {
            if (data.paymentMethods) {
                methods = data.paymentMethods.includes('[') 
                    ? JSON.parse(data.paymentMethods) 
                    : data.paymentMethods.split(',').filter(Boolean);
            }
        } catch (e) {
            methods = [];
        }

        setFormData({
          name: data.name || '',
          type: data.type || 'cafe',
          city: data.city || '',
          district: data.district || '',
          address: data.address || '',
          description: data.description || '',
          
          authorizedPerson: data.authorizedPerson || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          
          serviceType: data.serviceType || 'both',
          workingHours: data.workingHours || '',
          preparationTime: data.preparationTime?.toString() || '15',
          paymentMethods: methods,
          logoUrl: data.logoUrl || '',
          googleMapsUrl: data.googleMapsUrl || '',
          createdAt: data.createdAt,
        });
      }
    } catch (error) {
      toast.error('İşletme bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCafe();
  }, []);

  const handlePaymentChange = (checked: boolean, value: string) => {
    if (checked) {
      setFormData(prev => ({ ...prev, paymentMethods: [...prev.paymentMethods, value] }));
    } else {
      setFormData(prev => ({ ...prev, paymentMethods: prev.paymentMethods.filter(item => item !== value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cafeId = getCafeId();
    if (!cafeId) return;

    setSaving(true);
    try {
      // Prepare payload
      const payload = {
        ...formData,
        paymentMethods: JSON.stringify(formData.paymentMethods),
      };

      const res = await fetch(`${API_URL}/cafes/${cafeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('İşletme bilgileri güncellendi.');
      } else {
        toast.error('Güncelleme başarısız.');
      }
    } catch (error) {
      toast.error('Hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">İşletme Bilgileri</h2>
        <p className="text-muted-foreground">
          İşletmenizin kimlik, iletişim ve operasyonel bilgilerini buradan yönetebilirsiniz.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="identity" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="identity" className="flex items-center gap-2">
              <Store className="h-4 w-4" /> Temel Kimlik
            </TabsTrigger>
            <TabsTrigger value="authorized" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Yetkili Bilgisi
            </TabsTrigger>
            <TabsTrigger value="operation" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Operasyon Bilgisi
            </TabsTrigger>
          </TabsList>

          {/* 1. Temel Kimlik */}
          <TabsContent value="identity">
            <Card>
              <CardHeader>
                <CardTitle>İşletme Kimliği</CardTitle>
                <CardDescription>
                  İşletmenizin temel bilgileri ve adresi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">İşletme Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">İşletme Türü</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cafe">Kafe</SelectItem>
                        <SelectItem value="restaurant">Restoran</SelectItem>
                        <SelectItem value="patisserie">Pastane</SelectItem>
                        <SelectItem value="buffet">Büfe</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">İl</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Örn: İstanbul"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">İlçe</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      placeholder="Örn: Kadıköy"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Açık Adres</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Kısa Açıklama (Slogan)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Örn: Şehrin en iyi kahvesi..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Yetkili Bilgisi */}
          <TabsContent value="authorized">
            <Card>
              <CardHeader>
                <CardTitle>Yetkili İletişim Bilgileri</CardTitle>
                <CardDescription>
                  Müşterilerinizin veya tedarikçilerinizin ulaşabileceği bilgiler.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="authorizedPerson">Yetkili Adı Soyadı</Label>
                  <Input
                    id="authorizedPerson"
                    value={formData.authorizedPerson}
                    onChange={(e) => setFormData({ ...formData, authorizedPerson: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Web Sitesi</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Operasyon Bilgisi */}
          <TabsContent value="operation">
            <Card>
              <CardHeader>
                <CardTitle>Operasyon Detayları</CardTitle>
                <CardDescription>
                  Hizmet, çalışma saatleri ve diğer detaylar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Hizmet Şekli</Label>
                    <Select 
                      value={formData.serviceType} 
                      onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Sadece Masa Servis</SelectItem>
                        <SelectItem value="package">Sadece Paket Servis</SelectItem>
                        <SelectItem value="both">Masa ve Paket Servis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="preparationTime">Ortalama Hazırlama Süresi (dk)</Label>
                    <Input
                      id="preparationTime"
                      type="number"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workingHours">Çalışma Saatleri</Label>
                  <Input
                    id="workingHours"
                    value={formData.workingHours}
                    onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                    placeholder="Örn: Her gün 09:00 - 23:00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ödeme Türleri</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {paymentOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`payment-${option.id}`} 
                          checked={formData.paymentMethods.includes(option.id)}
                          onCheckedChange={(checked) => handlePaymentChange(checked as boolean, option.id)}
                        />
                        <label
                          htmlFor={`payment-${option.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleMapsUrl">Google Maps Linki</Label>
                  <Input
                    id="googleMapsUrl"
                    value={formData.googleMapsUrl}
                    onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                  {formData.logoUrl && (
                    <div className="mt-2">
                      <img src={formData.logoUrl} alt="Logo Önizleme" className="h-20 w-auto object-contain rounded border p-1" />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                    <Label className="text-muted-foreground">Kayıt Tarihi: </Label>
                    <span className="text-sm font-mono ml-2">
                        {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString('tr-TR') : '-'}
                    </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Değişiklikleri Kaydet
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
