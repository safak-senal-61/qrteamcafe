'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShieldAlert, User, Mail, Lock, Key, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';

export default function SuperAdminRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    registerKey: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/super-admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Süper Admin kaydı başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => {
          router.push('/admin/super/login');
        }, 1500);
      } else {
        const error = await response.json();
        let errorMessage = 'Kayıt başarısız.';
        if (error.message === 'Bu e-posta adresi zaten kullanımda.') {
          errorMessage = 'Bu e-posta adresi zaten kullanımda.';
        } else if (error.message === 'Geçersiz kayıt anahtarı.') {
          errorMessage = 'Girdiğiniz kayıt anahtarı geçersiz.';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black -z-10" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl text-slate-100 shadow-2xl shadow-indigo-500/10">
          <CardHeader className="space-y-4 text-center pb-8">
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="mx-auto bg-indigo-600 text-white p-3 rounded-2xl w-fit shadow-lg shadow-indigo-500/30"
            >
              <ShieldAlert className="h-8 w-8" />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">Süper Admin Kaydı</CardTitle>
              <CardDescription className="text-slate-400">
                Sadece yetkili personel içindir. Gizli anahtar gerektirir.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">Ad Soyad</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="name"
                    placeholder="Admin Adı"
                    className="pl-10 h-11 bg-slate-800/50 border-slate-700 focus:border-indigo-500 focus:bg-slate-800 text-slate-100 transition-all placeholder:text-slate-600"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    placeholder="admin@qrteam.com"
                    type="email"
                    className="pl-10 h-11 bg-slate-800/50 border-slate-700 focus:border-indigo-500 focus:bg-slate-800 text-slate-100 transition-all placeholder:text-slate-600"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Şifre Belirleyin</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-slate-800/50 border-slate-700 focus:border-indigo-500 focus:bg-slate-800 text-slate-100 transition-all placeholder:text-slate-600"
                    required
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registerKey" className="text-indigo-400 font-bold flex items-center gap-2">
                  <Key className="h-4 w-4" /> Gizli Kayıt Anahtarı
                </Label>
                <Input
                  id="registerKey"
                  type="password"
                  placeholder="Gizli anahtarı giriniz..."
                  className="h-11 bg-indigo-950/30 border-indigo-500/30 focus:border-indigo-500 text-indigo-100 placeholder:text-indigo-500/50"
                  required
                  value={formData.registerKey}
                  onChange={handleChange}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Kayıt Yapılıyor...
                  </>
                ) : (
                  <>
                    Kaydı Tamamla <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center text-sm text-slate-500 pb-8">
            <div className="w-full">
              Zaten hesabınız var mı?{' '}
              <Link href="/admin/super/login" className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline">
                Giriş Yapın
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
