'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/imageUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, Store, User, Settings2, Upload, Palette, Wifi, Share2, BellRing, Power, Shield, MapPin, Navigation, Network } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SecuritySettings from './components/SecuritySettings';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Helper to construct full URL
const getFullUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  // If it looks like a relative path stored as full URL with old IP/domain, fix it
  // Specifically for our uploads folder
  if (url.startsWith('http') && url.includes('/uploads/')) {
    try {
      const urlObj = new URL(url);
      // Use current API_URL + path
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      return `${baseUrl}${urlObj.pathname}`;
    } catch {
      // Fallback if URL parsing fails
      return url;
    }
  }

  if (url.startsWith('http')) return url;
  
  const baseUrl = API_URL;
  // Remove trailing slash from baseUrl if exists
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // Ensure url starts with /
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBaseUrl}${cleanUrl}`;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  // Cropper State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropTarget, setCropTarget] = useState<'logo' | 'cover'>('logo');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    // Basic Identity
    name: '',
    type: 'cafe',
    city: '',
    district: '',
    address: '',
    description: '',
    googleMapsUrl: '',
    
    // Visual & Brand
    logoUrl: '',
    coverImageUrl: '',
    brandColor: '#000000',
    theme: 'default', // default, bordo-gold, custom
    menuViewMode: 'card', // card, list
    welcomeMessage: '',

    // Digital & Social
    website: '',
    email: '',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    wifiSsid: '',
    wifiPassword: '',

    // Authorized Person
    authorizedPerson: '',
    phone: '',

    // Operational Info
    serviceType: 'both',
    workingHours: '',
    preparationTime: '15',
    paymentMethods: [] as string[],
    waiterCallOptions: ['bill', 'waiter'] as string[],
    showProductRatings: true,
    autoApproveReviews: false,
    isMaintenanceMode: false,
    createdAt: '',
    
    // Security - Geolocation
    geolocationEnabled: false,
    maxRange: '500',
    cafeLat: '',
    cafeLng: '',

    // Security - IP Restriction
    ipCheckEnabled: false,
    allowedIp: '',
  });

  const paymentOptions = [
    { id: 'cash', label: 'Nakit' },
    { id: 'credit_card', label: 'Kredi Kartı' },
    { id: 'ticket', label: 'Yemek Kartı (Sodexo, Multinet vb.)' },
    { id: 'online', label: 'Online Ödeme' },
  ];

  const waiterCallOptionList = [
    { id: 'bill', label: 'Hesap İste' },
    { id: 'waiter', label: 'Garson Çağır' },
    { id: 'cleanup', label: 'Masayı Topla' },
    { id: 'ashtray', label: 'Küllük İste' },
  ];

  const getCafeId = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr).cafeId;
  };

  const fetchCafe = useCallback(async () => {
    const cafeId = getCafeId();
    if (!cafeId) return;

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/cafes/${cafeId}`, {
        cache: 'no-store',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        
        // Helper to parse JSON or array fields safely
        const parseList = (field: string | string[] | undefined | null) => {
    try {
        if (!field) return [];
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') {
             if (field.startsWith('[')) return JSON.parse(field);
             return field.split(',').filter(Boolean);
        }
        return [];
    } catch { return []; }
  };

        setFormData({
          name: data.name || '',
          type: data.type || 'cafe',
          city: data.city || '',
          district: data.district || '',
          address: data.address || '',
          description: data.description || '',
          googleMapsUrl: data.googleMapsUrl || '',
          
          logoUrl: getFullUrl(data.logoUrl),
          coverImageUrl: getFullUrl(data.coverImageUrl),
          brandColor: data.brandColor || '#000000',
          theme: data.themeConfig ? JSON.parse(data.themeConfig).theme || 'default' : 'default',
          geolocationEnabled: data.themeConfig ? JSON.parse(data.themeConfig).geolocationEnabled || false : false,
          maxRange: data.themeConfig ? JSON.parse(data.themeConfig).maxRange || '500' : '500',
          cafeLat: data.themeConfig ? JSON.parse(data.themeConfig).cafeLat || '' : '',
          cafeLng: data.themeConfig ? JSON.parse(data.themeConfig).cafeLng || '' : '',
          ipCheckEnabled: data.themeConfig ? JSON.parse(data.themeConfig).ipCheckEnabled || false : false,
          allowedIp: data.themeConfig ? JSON.parse(data.themeConfig).allowedIp || '' : '',
          menuViewMode: data.menuViewMode || 'card',
          welcomeMessage: data.welcomeMessage || '',

          website: data.website || '',
          email: data.email || '',
          instagramUrl: data.instagramUrl || '',
          facebookUrl: data.facebookUrl || '',
          twitterUrl: data.twitterUrl || '',
          wifiSsid: data.wifiSsid || '',
          wifiPassword: data.wifiPassword || '',

          authorizedPerson: data.authorizedPerson || '',
          phone: data.phone || '',

          serviceType: data.serviceType || 'both',
          workingHours: data.workingHours || '',
          preparationTime: data.preparationTime?.toString() || '15',
          paymentMethods: parseList(data.paymentMethods),
          waiterCallOptions: parseList(data.waiterCallOptions).length > 0 ? parseList(data.waiterCallOptions) : ['bill', 'waiter'],
          showProductRatings: data.showProductRatings ?? true,
          autoApproveReviews: data.autoApproveReviews ?? false,
          isMaintenanceMode: data.isMaintenanceMode ?? false,
          createdAt: data.createdAt,
        });
      }
    } catch {
      toast.error('İşletme bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCafe();
  }, [fetchCafe]);

  const handleCheckboxChange = (
    field: 'paymentMethods' | 'waiterCallOptions', 
    checked: boolean, 
    value: string
  ) => {
    if (checked) {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], value] }));
    } else {
      setFormData(prev => ({ ...prev, [field]: prev[field].filter(item => item !== value) }));
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'cover') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Lütfen geçerli bir resim dosyası seçin.');
        return;
      }
      // setSelectedFile(file);
      setCropTarget(target);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result as string);
        setIsCropperOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    try {
      const mimeType = 'image/png';
      const extension = 'png';
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels, 0, { horizontal: false, vertical: false }, mimeType);
      
      if (!croppedBlob) {
        toast.error('Resim kırpılamadı.');
        return;
      }

      const file = new File([croppedBlob], `${cropTarget}.${extension}`, { type: mimeType });
      
      if (cropTarget === 'logo') {
        await handleLogoUpload(file);
      } else {
        await handleCoverUpload(file);
      }
      
      setIsCropperOpen(false);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (e) {
      console.error(e);
      toast.error('Kırpma işlemi başarısız.');
    }
  };

  const handleLogoUpload = async (file: File) => {
    const cafeId = getCafeId();
    if (!cafeId) return;

    setUploadingLogo(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const token = localStorage.getItem('token');
          if (!token) return;

          const res = await fetch(`${API_URL}/cafes/${cafeId}/logo`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload,
          });

      if (res.ok) {
        const data = await res.json();
        const fullLogoUrl = getFullUrl(data.logoUrl);
          
        setFormData(prev => ({ ...prev, logoUrl: fullLogoUrl }));
        toast.success('Logo başarıyla yüklendi.');
        window.dispatchEvent(new Event('cafe-info-updated'));
      } else {
        toast.error('Logo yüklenirken hata oluştu.');
      }
    } catch (_error) {
      console.error(_error);
      toast.error('Sunucu hatası.');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleCoverUpload = async (file: File) => {
    const cafeId = getCafeId();
    if (!cafeId) return;

    setUploadingCover(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/cafes/${cafeId}/cover-image`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        const fullCoverUrl = getFullUrl(data.coverImageUrl);
          
        setFormData(prev => ({ ...prev, coverImageUrl: fullCoverUrl }));
        toast.success('Kapak fotoğrafı başarıyla yüklendi.');
      } else {
        toast.error('Kapak fotoğrafı yüklenirken hata oluştu.');
      }
    } catch {
      toast.error('Sunucu hatası.');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cafeId = getCafeId();
    if (!cafeId) return;

    setSaving(true);
    try {
      // Exclude read-only fields like createdAt
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt, ...rest } = formData;
      
      const payload = {
        ...rest,
        paymentMethods: JSON.stringify(formData.paymentMethods),
        waiterCallOptions: JSON.stringify(formData.waiterCallOptions),
        themeConfig: JSON.stringify({ 
          theme: formData.theme,
          geolocationEnabled: formData.geolocationEnabled,
          maxRange: formData.maxRange,
          cafeLat: formData.cafeLat,
          cafeLng: formData.cafeLng,
          ipCheckEnabled: formData.ipCheckEnabled,
          allowedIp: formData.allowedIp
        }),
      };

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.');
        setSaving(false);
        return;
      }

      const res = await fetch(`${API_URL}/cafes/${cafeId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('İşletme bilgileri güncellendi.');
        window.dispatchEvent(new Event('cafe-info-updated'));
      } else {
        toast.error('Güncelleme başarısız.');
      }
    } catch (_error) {
      console.error(_error);
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
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-10 px-4 md:px-0 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">İşletme Ayarları</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Marka kimliği, operasyonel detaylar ve müşteri deneyimi ayarlarını buradan yönetebilirsiniz.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="identity" className="w-full space-y-6">
          <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
            <TabsList className="inline-flex h-auto w-auto md:w-full md:grid md:grid-cols-6 p-1 gap-2 bg-muted/50">
              <TabsTrigger value="identity" className="flex flex-col gap-2 py-3 px-4 md:px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Store className="h-4 w-4" /> 
                <span className="text-xs font-medium">Temel</span>
              </TabsTrigger>
              <TabsTrigger value="visual" className="flex flex-col gap-2 py-3 px-4 md:px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Palette className="h-4 w-4" /> 
                <span className="text-xs font-medium">Görünüm</span>
              </TabsTrigger>
              <TabsTrigger value="digital" className="flex flex-col gap-2 py-3 px-4 md:px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Share2 className="h-4 w-4" /> 
                <span className="text-xs font-medium">Dijital</span>
              </TabsTrigger>
              <TabsTrigger value="operation" className="flex flex-col gap-2 py-3 px-4 md:px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Settings2 className="h-4 w-4" /> 
                <span className="text-xs font-medium">Operasyon</span>
              </TabsTrigger>
              <TabsTrigger value="authorized" className="flex flex-col gap-2 py-3 px-4 md:px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <User className="h-4 w-4" /> 
                <span className="text-xs font-medium">Yetkili</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex flex-col gap-2 py-3 px-4 md:px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Shield className="h-4 w-4" /> 
                <span className="text-xs font-medium">Güvenlik</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 1. Temel Kimlik */}
          <TabsContent value="identity">
            <Card>
              <CardHeader>
                <CardTitle>İşletme Kimliği</CardTitle>
                <CardDescription>Temel bilgiler ve adres.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">İşletme Adı *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">İşletme Türü</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
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
                    <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">İlçe</Label>
                    <Input id="district" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Açık Adres</Label>
                  <Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Kısa Açıklama (Slogan)</Label>
                  <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleMapsUrl">Google Maps Linki</Label>
                  <Input id="googleMapsUrl" value={formData.googleMapsUrl} onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })} placeholder="https://maps.google.com/..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Görünüm */}
          <TabsContent value="visual">
            <Card>
              <CardHeader>
                <CardTitle>Görünüm ve Marka</CardTitle>
                <CardDescription>Menü tasarımı ve görseller.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo & Cover Image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo */}
                  <div className="space-y-2">
                    <Label>Logo (Kare)</Label>
                    <div className="flex flex-col gap-3">
                      <div className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden relative">
                        {formData.logoUrl ? (
                          <div className="relative h-full w-full">
                            <Image 
                              src={getFullUrl(formData.logoUrl)} 
                              alt="Logo" 
                              fill
                              className="object-contain p-1"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <Store className="h-8 w-8 text-muted-foreground/50" />
                        )}
                        {uploadingLogo && <div className="absolute inset-0 bg-background/80 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                      </div>
                      <div className="flex gap-2">
                        <Input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, 'logo')} />
                        <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                          <Upload className="mr-2 h-4 w-4" /> Logo Yükle
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-2">
                    <Label>Kapak Fotoğrafı (16:9)</Label>
                    <div className="flex flex-col gap-3">
                      <div className="h-32 w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden relative">
                        {formData.coverImageUrl ? (
                          <div className="relative h-full w-full">
                            <Image 
                              src={getFullUrl(formData.coverImageUrl)} 
                              alt="Cover" 
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground/50">
                            <Store className="h-8 w-8 mb-1" />
                            <span className="text-xs">Kapak Görseli Yok</span>
                          </div>
                        )}
                        {uploadingCover && <div className="absolute inset-0 bg-background/80 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                      </div>
                      <div className="flex gap-2">
                        <Input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, 'cover')} />
                        <Button type="button" variant="outline" size="sm" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
                          <Upload className="mr-2 h-4 w-4" /> Kapak Fotoğrafı Yükle
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tema Seçimi</Label>
                        <Select 
                          value={formData.theme} 
                          onValueChange={(value) => {
                            setFormData({ 
                              ...formData, 
                              theme: value,
                              // If Bordo-Gold is selected, auto-set the brand color for fallback
                              brandColor: value === 'bordo-gold' ? '#800020' : (value === 'default' ? '#10b981' : formData.brandColor)
                            });
                          }}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                                    <span>Varsayılan (Zümrüt Yeşili)</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="bordo-gold">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#800020] border border-[#FFD700]"></div>
                                    <span>Bordo - Gold (Premium)</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="custom">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                    <span>Özel (Marka Rengi)</span>
                                  </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.theme === 'custom' && (
                      <div className="space-y-2">
                          <Label htmlFor="brandColor">Marka Rengi</Label>
                          <div className="flex items-center gap-3">
                              <Input 
                                  id="brandColor" 
                                  type="color" 
                                  value={formData.brandColor} 
                                  onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })} 
                                  className="w-full h-10 p-1 cursor-pointer"
                              />
                              <span className="text-sm font-mono text-muted-foreground">{formData.brandColor}</span>
                          </div>
                      </div>
                    )}

                    <div className="space-y-2">
                        <Label>Menü Görünümü</Label>
                        <Select value={formData.menuViewMode} onValueChange={(value) => setFormData({ ...formData, menuViewMode: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="card">Kart Görünümü (Büyük Foto)</SelectItem>
                                <SelectItem value="list">Liste Görünümü (Sade)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Karşılama Mesajı</Label>
                    <Input 
                        id="welcomeMessage" 
                        value={formData.welcomeMessage} 
                        onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })} 
                        placeholder="Hoşgeldiniz! Bugünün spesiyali..."
                    />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Dijital */}
          <TabsContent value="digital">
            <Card>
              <CardHeader>
                <CardTitle>Dijital Varlıklar</CardTitle>
                <CardDescription>Sosyal medya ve Wi-Fi entegrasyonu.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2"><Share2 className="w-4 h-4" /> Sosyal Medya</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram</Label>
                            <Input id="instagram" placeholder="https://instagram.com/..." value={formData.instagramUrl} onChange={(e) => setFormData({...formData, instagramUrl: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="facebook">Facebook</Label>
                            <Input id="facebook" placeholder="https://facebook.com/..." value={formData.facebookUrl} onChange={(e) => setFormData({...formData, facebookUrl: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="twitter">Twitter / X</Label>
                            <Input id="twitter" placeholder="https://twitter.com/..." value={formData.twitterUrl} onChange={(e) => setFormData({...formData, twitterUrl: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Web Sitesi</Label>
                            <Input id="website" placeholder="https://..." value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium flex items-center gap-2"><Wifi className="w-4 h-4" /> Wi-Fi Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="wifiSsid">Wi-Fi Adı (SSID)</Label>
                            <Input id="wifiSsid" value={formData.wifiSsid} onChange={(e) => setFormData({...formData, wifiSsid: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wifiPassword">Wi-Fi Şifresi</Label>
                            <Input id="wifiPassword" value={formData.wifiPassword} onChange={(e) => setFormData({...formData, wifiPassword: e.target.value})} />
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Operasyon */}
          <TabsContent value="operation">
            <Card>
              <CardHeader>
                <CardTitle>Operasyon ve Servis</CardTitle>
                <CardDescription>Hizmet detayları ve servis ayarları.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border p-4 rounded-lg bg-secondary/10">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2"><Power className="w-4 h-4 text-red-500" /> Bakım Modu</Label>
                    <p className="text-sm text-muted-foreground">
                      Aktif edildiğinde menü &quot;Hizmet Dışı&quot; olarak görünür.
                    </p>
                  </div>
                  <Switch
                    checked={formData.isMaintenanceMode}
                    onCheckedChange={(checked) => setFormData({ ...formData, isMaintenanceMode: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hizmet Şekli</Label>
                    <Select value={formData.serviceType} onValueChange={(value) => setFormData({ ...formData, serviceType: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Sadece Masa</SelectItem>
                        <SelectItem value="package">Sadece Paket</SelectItem>
                        <SelectItem value="both">Masa ve Paket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hazırlama Süresi (dk)</Label>
                    <Input type="number" value={formData.preparationTime} onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Çalışma Saatleri</Label>
                  <Input value={formData.workingHours} onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })} placeholder="Örn: 09:00 - 23:00" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="space-y-2">
                        <Label>Ödeme Türleri</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                            {paymentOptions.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox 
                                id={`payment-${option.id}`} 
                                checked={formData.paymentMethods.includes(option.id)}
                                onCheckedChange={(checked) => handleCheckboxChange('paymentMethods', checked as boolean, option.id)}
                                />
                                <label htmlFor={`payment-${option.id}`} className="text-sm font-medium">{option.label}</label>
                            </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><BellRing className="w-4 h-4" /> Garson Çağırma Seçenekleri</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                            {waiterCallOptionList.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox 
                                id={`waiter-${option.id}`} 
                                checked={formData.waiterCallOptions.includes(option.id)}
                                onCheckedChange={(checked) => handleCheckboxChange('waiterCallOptions', checked as boolean, option.id)}
                                />
                                <label htmlFor={`waiter-${option.id}`} className="text-sm font-medium">{option.label}</label>
                            </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between border p-3 rounded-lg mt-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Ürün Değerlendirmeleri</Label>
                    <p className="text-sm text-muted-foreground">Müşteriler ürünleri puanlayabilir.</p>
                  </div>
                  <Switch
                    checked={formData.showProductRatings}
                    onCheckedChange={(checked) => setFormData({ ...formData, showProductRatings: checked })}
                  />
                </div>

                <div className="flex items-center justify-between border p-3 rounded-lg mt-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Otomatik Yorum Onayı</Label>
                    <p className="text-sm text-muted-foreground">Müşteri yorumları kontrol edilmeden otomatik yayınlansın.</p>
                  </div>
                  <Switch
                    checked={formData.autoApproveReviews}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoApproveReviews: checked })}
                    disabled={!formData.showProductRatings}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Yetkili */}
          <TabsContent value="authorized">
            <Card>
              <CardHeader>
                <CardTitle>Yetkili Bilgileri</CardTitle>
                <CardDescription>İletişim bilgileri.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="authorizedPerson">Ad Soyad</Label>
                  <Input id="authorizedPerson" value={formData.authorizedPerson} onChange={(e) => setFormData({ ...formData, authorizedPerson: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 6. Güvenlik */}
          <TabsContent value="security">
            {/* Geolocation Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Konum Doğrulama
                </CardTitle>
                <CardDescription>
                  Sadece işletmenize fiziksel olarak yakın olan müşterilerin sipariş vermesine izin verin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 border p-4 rounded-lg">
                  <Switch
                    id="geolocationEnabled"
                    checked={formData.geolocationEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, geolocationEnabled: checked })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="geolocationEnabled" className="text-base font-medium">
                      Konum Kontrolünü Etkinleştir
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Aktif edildiğinde, sipariş vermek isteyen müşterilerin konumu kontrol edilir.
                    </p>
                  </div>
                </div>

                {formData.geolocationEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxRange">Maksimum Mesafe (Metre)</Label>
                      <Input
                        id="maxRange"
                        type="number"
                        value={formData.maxRange}
                        onChange={(e) => setFormData({ ...formData, maxRange: e.target.value })}
                        placeholder="Örn: 500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Müşterinin sipariş verebilmesi için işletmeye olan maksimum uzaklığı.
                      </p>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                        <Label htmlFor="cafeLat">Enlem (Latitude)</Label>
                        <div className="relative">
                          <Input
                            id="cafeLat"
                            value={formData.cafeLat}
                            onChange={(e) => setFormData({ ...formData, cafeLat: e.target.value })}
                            placeholder="Örn: 41.0082"
                          />
                          <Navigation className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cafeLng">Boylam (Longitude)</Label>
                        <div className="relative">
                          <Input
                            id="cafeLng"
                            value={formData.cafeLng}
                            onChange={(e) => setFormData({ ...formData, cafeLng: e.target.value })}
                            placeholder="Örn: 28.9784"
                          />
                          <Navigation className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                       <Button 
                         type="button" 
                         variant="outline" 
                         onClick={() => {
                           if (!window.isSecureContext) {
                             toast.error('Konum servisi sadece HTTPS veya localhost üzerinde çalışır. Bu IP adresinde çalışmayabilir.');
                             // We still try, but warn first
                           }

                           if (navigator.geolocation) {
                             navigator.geolocation.getCurrentPosition(
                               (position) => {
                                 setFormData({
                                   ...formData,
                                   cafeLat: position.coords.latitude.toString(),
                                   cafeLng: position.coords.longitude.toString()
                                 });
                                 toast.success('Mevcut konumunuz alındı.');
                               },
                               (error) => {
                                 console.warn('Geolocation error:', error);
                                 let errorMsg = 'Konum alınamadı.';
                                 if (error.code === 1) errorMsg = 'Konum izni reddedildi.';
                                 if (error.code === 2) errorMsg = 'Konum bilgisi kullanılamıyor.';
                                 if (error.code === 3) errorMsg = 'Konum isteği zaman aşımına uğradı.';
                                 
                                 if (!window.isSecureContext) {
                                   errorMsg += ' (HTTPS gerekli olabilir)';
                                 }
                                 
                                 toast.error(errorMsg);
                               }
                             );
                           } else {
                             toast.error('Tarayıcınız konum servisini desteklemiyor.');
                           }
                         }}
                         className="w-full md:w-auto"
                       >
                         <MapPin className="mr-2 h-4 w-4" />
                         Mevcut Konumumu Kullan
                       </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* IP Restriction Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  IP Kısıtlaması (Wi-Fi Zorunluluğu)
                </CardTitle>
                <CardDescription>
                  Müşterilerin sadece işletmenizin internet ağına (Wi-Fi) bağlıyken sipariş vermesini sağlar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 border p-4 rounded-lg">
                  <Switch
                    id="ipCheckEnabled"
                    checked={formData.ipCheckEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, ipCheckEnabled: checked })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="ipCheckEnabled" className="text-base font-medium">
                      IP Kontrolünü Etkinleştir
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Aktif edildiğinde, müşterinin IP adresi kontrol edilir ve sadece izin verilen IP&apos;den sipariş kabul edilir.
                    </p>
                  </div>
                </div>

                {formData.ipCheckEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-2">
                      <Label htmlFor="allowedIp">İşletme Dış IP Adresi</Label>
                      <Input
                        id="allowedIp"
                        value={formData.allowedIp}
                        onChange={(e) => setFormData({ ...formData, allowedIp: e.target.value })}
                        placeholder="Örn: 88.254.12.34"
                      />
                      <p className="text-xs text-muted-foreground">
                        İşletmenizin internet çıkış IP adresi. Müşteriler Wi-Fi&apos;ye bağlandığında bu IP ile görünürler.
                      </p>
                    </div>
                    
                    <div className="flex items-end">
                       <Button 
                         type="button" 
                         variant="outline" 
                         onClick={async () => {
                           try {
                             const res = await fetch('https://api.ipify.org?format=json');
                             const data = await res.json();
                             setFormData({ ...formData, allowedIp: data.ip });
                             toast.success(`IP Adresiniz alındı: ${data.ip}`);
                           } catch (error) {
                             console.error(error);
                             toast.error('IP adresi alınamadı.');
                           }
                         }}
                         className="w-full md:w-auto"
                       >
                         <Network className="mr-2 h-4 w-4" />
                         Mevcut IP Adresimi Getir
                       </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <SecuritySettings />
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

      {/* Cropper Dialog */}
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{cropTarget === 'logo' ? 'Logoyu Düzenle' : 'Kapak Fotoğrafını Düzenle'}</DialogTitle>
            <DialogDescription>
              {cropTarget === 'logo' ? 'Kare (1:1)' : 'Geniş (16:9)'} formatında kırpın.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-80 bg-black/5 rounded-md overflow-hidden">
            {selectedImage && (
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={cropTarget === 'logo' ? 1 : 16 / 9}
                onCropChange={setCrop}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="space-y-2 py-4">
            <div className="flex justify-between text-xs">
              <span>Yakınlaştır</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropperOpen(false)}>İptal</Button>
            <Button onClick={onCropSave} disabled={uploadingLogo || uploadingCover}>
              {(uploadingLogo || uploadingCover) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet ve Yükle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
