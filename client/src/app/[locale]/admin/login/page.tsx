'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter as DialogFooterUI,
} from "@/components/ui/dialog";
import { Coffee, Lock, Mail, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';

export default function AdminLoginPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'SUPER_ADMIN') {
          router.push('/admin/super/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, [router]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // 2FA State
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Forgot Password State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    try {
      if (forgotPasswordStep === 1) {
        // Step 1: Send Code
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail }),
        });
        const data = await response.json();
        if (response.ok) {
          toast.success(data.message);
          setForgotPasswordStep(2);
        } else {
          toast.error(data.message || 'Bir hata oluştu.');
        }
      } else if (forgotPasswordStep === 2) {
        // Step 2: Verify Code
        const response = await fetch(`${API_URL}/auth/verify-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, code: resetCode }),
        });
        const data = await response.json();
        if (response.ok) {
          toast.success(data.message);
          setForgotPasswordStep(3);
        } else {
          toast.error(data.message || 'Kod hatalı.');
        }
      } else if (forgotPasswordStep === 3) {
        // Step 3: Reset Password
        const response = await fetch(`${API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword }),
        });
        const data = await response.json();
        if (response.ok) {
          toast.success(data.message);
          setIsForgotPasswordOpen(false);
          setForgotPasswordStep(1);
          setResetEmail('');
          setResetCode('');
          setNewPassword('');
        } else {
          toast.error(data.message || 'Şifre sıfırlanamadı.');
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Bir hata oluştu.');
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const body: { [key: string]: string } = { ...formData };
      if (is2FARequired) {
        body.twoFactorCode = twoFactorCode;
      }

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        if (data.user.role === 'SUPER_ADMIN') {
          toast.success('Süper Admin girişi algılandı. Yönlendiriliyorsunuz...');
          setTimeout(() => {
            router.push('/admin/super/dashboard');
          }, 1000);
        } else {
          toast.success('Giriş başarılı! Yönlendiriliyorsunuz...');
          setTimeout(() => {
            router.push('/admin/dashboard');
          }, 1000);
        }
      } else {
        if (data.message === '2FA_REQUIRED' || data.code === '2FA_REQUIRED') {
            setIs2FARequired(true);
            toast.info('Lütfen 2FA kodunuzu girin.');
        } else {
            toast.error(data.message || 'Giriş başarısız.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
      {/* Arka Plan Görseli - Tam Ekran */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=2078&auto=format&fit=crop")',
        }}
      />
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      
      {/* Ana İçerik Konteyner */}
      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 p-6 items-center">
        
        {/* Sol Taraf - Marka ve Sloganlar */}
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
              Sipariş takibi, stok yönetimi ve detaylı raporlar ile işletmenizi bir üst seviyeye taşıyın.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
              <div className="bg-white/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                <Loader2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Hızlı İşlem</h3>
              <p className="text-white/60 text-sm">Saniyeler içinde sipariş alın ve yönetin.</p>
            </div>
            <div className="space-y-2">
              <div className="bg-white/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Güvenli Altyapı</h3>
              <p className="text-white/60 text-sm">Verileriniz uçtan uca şifreleme ile güvende.</p>
            </div>
          </div>
        </div>

        {/* Sağ Taraf - Giriş Formu Kartı */}
        <div className="w-full flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[440px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 md:p-10 space-y-8">
              <div className="text-center space-y-2">
                <div className="mx-auto bg-white/10 text-white p-3 rounded-2xl w-fit mb-6 lg:hidden">
                  <Coffee className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  {is2FARequired ? t('2fa.title') : t('login.title')}
                </h2>
                <p className="text-white/70">
                  {is2FARequired 
                    ? t('2fa.desc')
                    : t('login.desc')
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {is2FARequired ? (
                  <div className="space-y-2">
                    <Label htmlFor="twoFactorCode" className="text-white">{t('common.verificationCode')}</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                      <Input
                        id="twoFactorCode"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        placeholder="123456"
                        className="pl-10 tracking-widest text-lg text-center font-mono h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-amber-500/50 transition-colors"
                        maxLength={6}
                        autoFocus
                        required
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full text-xs text-white/60 hover:text-white hover:bg-white/10"
                      onClick={() => {
                        setIs2FARequired(false);
                        setTwoFactorCode('');
                      }}
                    >
                      {t('common.back')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">{t('common.email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                        <Input
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="ornek@cafe.com"
                          type="email"
                          className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-amber-500/50 transition-colors"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-white">{t('common.password')}</Label>
                        <Button
                          type="button"
                          variant="link"
                          className="text-xs font-medium text-amber-500 hover:text-amber-400 hover:underline p-0 h-auto"
                          onClick={() => {
                            setForgotPasswordStep(1);
                            setIsForgotPasswordOpen(true);
                          }}
                        >
                          {t('forgotPassword.link')}
                        </Button>
                      </div>
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
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full h-11 font-bold text-base bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {is2FARequired ? t('common.verifying') : t('login.loggingIn')}
                    </>
                  ) : (
                    <>
                      {is2FARequired ? t('common.verifyAndLogin') : t('login.submit')} 
                      {!is2FARequired && <ArrowRight className="ml-2 h-4 w-4" />}
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-white/60">
                {t('login.noAccount')}{' '}
                <Link href="/admin/register" className="font-semibold text-amber-500 hover:text-amber-400 hover:underline transition-colors">
                  {t('login.registerLink')}
                </Link>
              </div>
            </div>
            
            {/* Kart Altı Dekoratif Çizgi */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          </motion.div>
        </div>
      </div>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('forgotPassword.title')}</DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === 1 && (t('forgotPassword.step1Desc') || 'E-posta adresinizi giriniz.')}
              {forgotPasswordStep === 2 && (t('forgotPassword.step2Desc') || 'Doğrulama kodunu giriniz.')}
              {forgotPasswordStep === 3 && (t('forgotPassword.step3Desc') || 'Yeni şifrenizi belirleyiniz.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {forgotPasswordStep === 1 && (
              <div className="space-y-2">
                <Label htmlFor="resetEmail">{t('common.email')}</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="ornek@cafe.com"
                  className="focus-visible:ring-amber-500"
                  required
                />
              </div>
            )}
            {forgotPasswordStep === 2 && (
              <div className="space-y-2">
                <Label htmlFor="resetCode">{t('common.verificationCode')}</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resetCode"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    className="pl-10 tracking-widest text-lg focus-visible:ring-amber-500"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            )}
            {forgotPasswordStep === 3 && (
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('forgotPassword.newPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 focus-visible:ring-amber-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}
            <DialogFooterUI>
              <Button type="submit" disabled={isResetLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
                {isResetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.verifying')}
                  </>
                ) : (
                  <>
                    {forgotPasswordStep === 1 && t('forgotPassword.sendCode')}
                    {forgotPasswordStep === 2 && t('common.verify')}
                    {forgotPasswordStep === 3 && t('forgotPassword.updatePassword')}
                  </>
                )}
              </Button>
            </DialogFooterUI>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
