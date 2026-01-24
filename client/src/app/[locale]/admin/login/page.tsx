'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
      } catch (e) {
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
      const body: any = { ...formData };
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
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
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

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('forgotPassword.title')}</DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === 1 && t('forgotPassword.step1Desc')}
              {forgotPasswordStep === 2 && t('forgotPassword.step2Desc')}
              {forgotPasswordStep === 3 && t('forgotPassword.step3Desc')}
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
                    className="pl-10 tracking-widest text-lg"
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
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}
            <DialogFooterUI>
              <Button type="submit" disabled={isResetLoading}>
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
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {is2FARequired ? t('2fa.title') : t('login.title')}
              </CardTitle>
              <CardDescription>
                {is2FARequired 
                    ? t('2fa.desc')
                    : t('login.desc')
                }
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {is2FARequired ? (
                <div className="space-y-2">
                    <Label htmlFor="twoFactorCode">{t('common.verificationCode')}</Label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="twoFactorCode"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            placeholder="123456"
                            className="pl-10 tracking-widest text-lg text-center font-mono"
                            maxLength={6}
                            autoFocus
                            required
                        />
                    </div>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => {
                            setIs2FARequired(false);
                            setTwoFactorCode('');
                        }}
                    >
                        {t('common.back')}
                    </Button>
                </div>
              ) : (
                <>
                <div className="space-y-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
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
                    <Label htmlFor="password">{t('common.password')}</Label>
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
                    <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="link"
                        className="text-xs font-medium text-primary hover:underline p-0 h-auto"
                        onClick={() => {
                        setForgotPasswordStep(1);
                        setIsForgotPasswordOpen(true);
                        }}
                    >
                        {t('forgotPassword.link')}
                    </Button>
                    </div>
                </div>
                </>
              )}
              
              <Button
                type="submit"
                className="w-full h-11 font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
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
          </CardContent>
          <CardFooter className="text-center text-sm text-muted-foreground pb-8">
            <div className="w-full">
              {t('login.noAccount')}{' '}
              <Link href="/admin/register" className="font-bold text-primary hover:underline">
                {t('login.registerLink')}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
