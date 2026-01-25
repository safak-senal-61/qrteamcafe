'use client';

import { useState, useRef } from 'react';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Coffee, User, Mail, Phone, Lock, Store, ArrowRight, Loader2, CheckCircle2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import Cropper, { Area } from 'react-easy-crop';
import getCroppedImg from '@/lib/imageUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function RegisterPage() {
  const t = useTranslations('Auth');
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
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
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
        toast.error(t('register.invalidImage'));
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

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const onCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    try {
      const mimeType = 'image/png';
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels, 0, { horizontal: false, vertical: false }, mimeType);
      if (!croppedBlob) {
        toast.error(t('register.cropError'));
        return;
      }

      // Convert Blob to File
      const file = new File([croppedBlob], 'logo.png', { type: mimeType });
      
      // Update preview and selected file
      setLogoPreview(URL.createObjectURL(croppedBlob));
      setSelectedFile(file);
      
      setIsCropperOpen(false);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (e) {
      console.error(e);
      toast.error(t('register.cropFailed'));
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
        toast.success(t('register.successTitle'));
      } else {
        const error = await response.json();
        let errorMessage = t('register.failMessage');
        if (error.message === 'Bu e-posta adresi zaten kullanımda.') {
          errorMessage = t('register.emailInUse');
        } else if (Array.isArray(error.message)) {
          errorMessage = error.message.join(', ');
        } else {
          errorMessage = error.message || t('register.failMessage');
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(t('register.errorGeneric'));
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
            <h2 className="text-2xl font-bold mb-2">{t('register.successHeading')}</h2>
            <p className="text-muted-foreground mb-8">
              {t('register.successDesc')}
            </p>
            <Link href="/admin/login">
              <Button className="w-full h-12 rounded-xl text-lg">
                {t('register.backToLogin')}
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
              <CardTitle className="text-2xl font-bold tracking-tight">{t('register.title')}</CardTitle>
              <CardDescription>
                {t('register.desc')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cafeName">{t('register.cafeName')}</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cafeName"
                    value={formData.cafeName}
                    onChange={handleChange}
                    placeholder={t('register.cafeNamePlaceholder')}
                    className="pl-10 h-11 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('register.cafeLogo')}</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-secondary/50 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <div className="relative w-full h-full">
                        <Image 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
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
                      {t('register.selectLogo')}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                        {t('register.logoHint')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('register.fullName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder={t('register.fullNamePlaceholder')}
                      className="pl-10 h-11 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('register.phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t('register.phonePlaceholder')}
                      type="tel"
                      className="pl-10 h-11 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('register.emailPlaceholder')}
                    type="email"
                    className="pl-10 h-11 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('register.setPassword')}</Label>
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
                    {t('register.sending')}
                  </>
                ) : (
                  <>
                    {t('register.submit')} <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center text-sm text-muted-foreground pb-8">
            <div className="w-full">
              {t('register.hasAccount')}{' '}
              <Link href="/admin/login" className="font-bold text-primary hover:underline">
                {t('register.loginLink')}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Cropper Dialog */}
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('register.editLogo')}</DialogTitle>
            <DialogDescription>
              {t('register.cropDesc')}
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
              <span>{t('register.zoom')}</span>
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
              {t('common.cancel')}
            </Button>
            <Button onClick={onCropSave}>
              {t('common.cropAndSave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
