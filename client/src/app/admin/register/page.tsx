'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Coffee, User, Mail, Phone, Lock, Store, ArrowRight, Loader2, CheckCircle2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/imageUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    cafeName: '',
    fullName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Cropper State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Lütfen geçerli bir resim dosyası seçin.');
        return;
      }
      // Keep the original file for later use if needed, but we mostly care about the cropped one
      // However, we start by showing the cropper with this file
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result as string);
        setIsCropperOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const onCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      if (!croppedBlob) {
        toast.error('Resim kırpılamadı.');
        return;
      }

      // Convert Blob to File
      const file = new File([croppedBlob], 'logo.jpg', { type: 'image/jpeg' });
      
      // Update preview and selected file
      setLogoPreview(URL.createObjectURL(croppedBlob));
      setSelectedFile(file);
      
      setIsCropperOpen(false);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (e) {
      console.error(e);
      toast.error('Kırpma işlemi başarısız.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First register the user and cafe
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeName: formData.cafeName,
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // If logo is selected, upload it
        if (selectedFile && data.cafeId) {
            const formDataUpload = new FormData();
            formDataUpload.append('file', selectedFile);

            await fetch(`${API_URL}/cafes/${data.cafeId}/logo`, {
                method: 'PATCH',
                body: formDataUpload,
            });
        }

        setIsSuccess(true);
        toast.success('Başvurunuz başarıyla alındı!');
      } else {
        const error = await response.json();
        let errorMessage = 'Başvuru başarısız.';
        if (error.message === 'Bu e-posta adresi zaten kullanımda.') {
          errorMessage = 'Bu e-posta adresi zaten kullanımda.';
        } else if (Array.isArray(error.message)) {
          errorMessage = error.message.join(', ');
        } else {
          errorMessage = error.message || 'Başvuru başarısız.';
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl text-center p-8">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Başvurunuz Alındı!</h2>
            <p className="text-muted-foreground mb-8">
              Cafe başvurunuz başarıyla bize ulaştı. Ekibimiz başvurunuzu inceledikten sonra e-posta adresiniz üzerinden size dönüş yapacaktır.
            </p>
            <Link href="/admin/login">
              <Button className="w-full h-12 rounded-xl text-lg">
                Giriş Ekranına Dön
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="mx-auto bg-primary text-primary-foreground p-3 rounded-2xl w-fit shadow-lg shadow-primary/30"
            >
              <Coffee className="h-8 w-8" />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">İşletme Başvurusu</CardTitle>
              <CardDescription>
                Hemen başvurunuzu yapın, dijital menü dünyasına katılın.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cafeName">İşletme Adı</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cafeName"
                    value={formData.cafeName}
                    onChange={handleChange}
                    placeholder="Cafe Adı"
                    className="pl-10 h-11 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>İşletme Logosu</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-secondary/50 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-cover" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Logo Seç
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                        Zorunlu değildir. (Önerilen: 512x512px)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Ad Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Adınız"
                      className="pl-10 h-11 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="555..."
                      type="tel"
                      className="pl-10 h-11 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ornek@cafe.com"
                    type="email"
                    className="pl-10 h-11 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Şifre Belirleyin</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    Başvuruyu Tamamla <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center text-sm text-muted-foreground pb-8">
            <div className="w-full">
              Zaten hesabınız var mı?{' '}
              <Link href="/admin/login" className="font-bold text-primary hover:underline">
                Giriş Yapın
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Cropper Dialog */}
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Logoyu Düzenle</DialogTitle>
            <DialogDescription>
              Logonuzu kare formatında kırpın ve ayarlayın.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-80 bg-black/5 rounded-md overflow-hidden">
            {selectedImage && (
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
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
            <Button variant="outline" onClick={() => setIsCropperOpen(false)}>
              İptal
            </Button>
            <Button onClick={onCropSave}>
              Kırp ve Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
