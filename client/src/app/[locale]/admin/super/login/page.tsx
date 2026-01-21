'use client';

import { useState } from 'react';
import { useRouter } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user.role === 'SUPER_ADMIN') {
          toast.success('Yönetici girişi başarılı!');
          localStorage.setItem('user', JSON.stringify(data.user));
          setTimeout(() => {
            router.push('/admin/super/dashboard');
          }, 1000);
        } else {
          toast.error('Bu alana sadece Süper Adminler giriş yapabilir.');
        }
      } else {
        toast.error(data.message || 'Giriş başarısız.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Sunucuya bağlanılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl text-slate-100">
          <CardHeader className="space-y-4 text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="mx-auto bg-indigo-600 text-white p-3 rounded-2xl w-fit shadow-lg shadow-indigo-500/20"
            >
              <ShieldCheck className="h-8 w-8" />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">Süper Admin</CardTitle>
              <CardDescription className="text-slate-400">
                Sistem yönetimi ve onay işlemleri için giriş yapın
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@qrteam.com"
                    type="email"
                    className="pl-10 h-11 bg-slate-800/50 border-slate-700 focus:border-indigo-500 focus:bg-slate-800 text-slate-100 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-slate-800/50 border-slate-700 focus:border-indigo-500 focus:bg-slate-800 text-slate-100 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş Yapılıyor...
                  </>
                ) : (
                  <>
                    Giriş Yap <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
