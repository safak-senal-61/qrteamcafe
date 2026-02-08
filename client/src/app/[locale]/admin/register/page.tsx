'use client';

import { useState, useRef } from 'react';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coffee, User, Mail, Phone, Lock, Store, ArrowRight, Loader2, CheckCircle2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { API_URL, getMediaUrl } from '@/lib/api';
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
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
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
      if (step === 'form') {
        // Step 1: Send verification code
        const response = await fetch(`${API_URL}/auth/send-verification-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        });

        if (response.ok) {
          setStep('verify');
          toast.success(t('register.codeSent'));
        } else {
          const error = await response.json();
          toast.error(error.message || t('register.failMessage'));
        }
      } else {
        // Step 2: Register with code
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cafeName: formData.cafeName,
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            password: formData.password,
            verificationCode,
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
      <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
         {/* Background Image - Same as Login */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=2078&auto=format&fit=crop")',
          }}
        />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-full max-w-md p-6"
        >
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-center p-8">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 border border-green-500/30">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">{t('register.successHeading')}</h2>
            <p className="text-white/70 mb-8">
              {t('register.successDesc')}
            </p>
            <Link href="/admin/login">
              <Button className="w-full h-12 rounded-xl text-lg bg-amber-500 hover:bg-amber-600 text-black font-bold">
                {t('register.backToLogin')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
      {/* Background Image - Same as Login */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=2078&auto=format&fit=crop")',
        }}
      />
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      
      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-16 p-6 items-center">
        
        {/* Left Side - Register Form Card */}
        <div className="w-full flex justify-center lg:justify-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[550px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 md:p-10 space-y-6">
              <div className="text-center space-y-2">
                 <div className="mx-auto bg-white/10 text-white p-3 rounded-2xl w-fit mb-6 lg:hidden">
                   <Coffee className="h-8 w-8" />
                 </div>
                <h2 className="text-3xl font-bold tracking-tight text-white">{t('register.title')}</h2>
                <p className="text-white/70">
                  {t('register.desc')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {step === 'form' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cafeName" className="text-white">{t('register.cafeName')}</Label>
                      <div className="relative">
                        <Store className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                        <Input
                          id="cafeName"
                          value={formData.cafeName}
                          onChange={handleChange}
                          placeholder={t('register.cafeNamePlaceholder')}
                          className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-amber-500/50 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">{t('register.cafeLogo')}</Label>
                      <div className="flex items-center gap-4">
                        <div 
                          className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {logoPreview ? (
                            <div className="relative w-full h-full">
                              <Image 
                                src={getMediaUrl(logoPreview)} 
                                alt="Logo Preview" 
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <Upload className="h-6 w-6 text-white/50" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
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
                          <p className="text-xs text-white/40 mt-1 text-center">
                              {t('register.logoHint')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-white">{t('register.fullName')}</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder={t('register.fullNamePlaceholder')}
                            className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-amber-500/50 transition-colors"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-white">{t('register.phone')}</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder={t('register.phonePlaceholder')}
                            type="tel"
                            className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-amber-500/50 transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">{t('common.email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                        <Input
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder={t('register.emailPlaceholder')}
                          type="email"
                          className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-amber-500/50 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">{t('register.setPassword')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                        <Input
                          id="password"
                          value={formData.password}
                          onChange={handleChange}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-amber-500/50 transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="text-center space-y-2">
                      <Mail className="h-12 w-12 mx-auto text-amber-500" />
                      <h3 className="font-semibold text-lg text-white">{t('register.verifyEmail')}</h3>
                      <p className="text-sm text-white/70">
                        {t('register.verifyEmailDesc', { email: formData.email })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-white">{t('register.verificationCode')}</Label>
                      <Input
                        id="code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="123456"
                        className="text-center text-lg tracking-widest h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-amber-500/50"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 font-bold text-lg bg-amber-500 hover:bg-amber-600 text-black transition-all mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('register.sending')}
                    </>
                  ) : (
                    <>
                      {step === 'form' ? t('register.continue') : t('register.complete')} <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            <div className="text-center text-sm text-white/60 pb-8 bg-black/20 p-4 border-t border-white/5">
                {t('register.hasAccount')}{' '}
                <Link href="/admin/login" className="font-bold text-amber-500 hover:text-amber-400 hover:underline">
                  {t('register.loginLink')}
                </Link>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Brand & Slogans (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-col text-white space-y-8">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/20">
              <Coffee className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">qrders</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Yönetim parmaklarınızın ucunda.
            </h1>
            <p className="text-xl text-white/80 leading-relaxed max-w-lg">
              İşletmenizi dijital dünyaya taşıyın, siparişleri hızlandırın ve müşteri memnuniyetini artırın.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
              <div className="bg-white/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                <Loader2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Hızlı Kurulum</h3>
              <p className="text-white/60 text-sm">Dakikalar içinde menünüzü oluşturun ve yayına alın.</p>
            </div>
            <div className="space-y-2">
              <div className="bg-white/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Güvenli Altyapı</h3>
              <p className="text-white/60 text-sm">Verileriniz ve ödemeleriniz güvende.</p>
            </div>
          </div>
        </div>
      </div>

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
