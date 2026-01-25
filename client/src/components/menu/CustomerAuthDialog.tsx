'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Loader2, 
  UtensilsCrossed, 
  UserCircle2, 
  ArrowRight, 
  ChevronLeft,
  Coffee,
  MailCheck,
} from 'lucide-react';
import { useCustomerStore } from '@/store/customer-store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

const verifySchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  code: z.string().length(6, 'Doğrulama kodu 6 haneli olmalıdır'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  code: z.string().length(6, 'Kod 6 haneli olmalıdır'),
  newPassword: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

type AuthView = 'welcome' | 'login' | 'register' | 'verification' | 'forgot-password' | 'reset-password';

interface CustomerAuthDialogProps {
  variant?: 'default' | 'premium' | 'bistro' | 'modern' | 'classic' | 'minimal';
}

export function CustomerAuthDialog({ variant = 'default' }: CustomerAuthDialogProps) {
  const { isAuthDialogOpen, setAuthDialogOpen, setCustomer, setGuest } = useCustomerStore();
  const [view, setView] = useState<AuthView>('welcome');
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const theme = {
    default: {
      gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
      contentBg: "bg-white/75",
      titleColor: "text-gray-900",
      textColor: "text-gray-500",
      labelColor: "text-gray-700",
      inputBg: "bg-white/50",
      inputBorder: "border-gray-200",
      inputFocus: "focus:border-emerald-500 focus:ring-emerald-500",
      primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30",
      secondaryBtn: "border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 bg-white/50 text-emerald-600",
      link: "text-emerald-600 hover:text-emerald-700",
      iconBox: "bg-white/20 border-white/10",
      iconColor: "text-white",
      divider: "bg-white/50 text-gray-400",
      successIconBg: "bg-emerald-100",
      successIconColor: "text-emerald-600"
    },
    classic: {
      gradient: "bg-gradient-to-br from-blue-600 to-indigo-700",
      contentBg: "bg-white",
      titleColor: "text-gray-900",
      textColor: "text-gray-600",
      labelColor: "text-gray-700",
      inputBg: "bg-white",
      inputBorder: "border-gray-200",
      inputFocus: "focus:border-blue-500 focus:ring-blue-500",
      primaryBtn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-blue-500/30",
      secondaryBtn: "border-blue-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 bg-white text-blue-600",
      link: "text-blue-600 hover:text-blue-700",
      iconBox: "bg-white/20 border-white/10",
      iconColor: "text-white",
      divider: "bg-gray-100 text-gray-400",
      successIconBg: "bg-blue-50",
      successIconColor: "text-blue-600"
    },
    minimal: {
      gradient: "bg-zinc-50 border-b border-zinc-200",
      contentBg: "bg-white",
      titleColor: "text-zinc-900",
      textColor: "text-zinc-500",
      labelColor: "text-zinc-700",
      inputBg: "bg-white",
      inputBorder: "border-zinc-200",
      inputFocus: "focus:border-zinc-400 focus:ring-zinc-200 text-zinc-900",
      primaryBtn: "bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-900/10",
      secondaryBtn: "border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 bg-white text-zinc-600",
      link: "text-zinc-900 hover:text-zinc-600",
      iconBox: "bg-zinc-200 text-zinc-700",
      iconColor: "text-zinc-700",
      divider: "bg-zinc-100 text-zinc-400",
      successIconBg: "bg-zinc-100",
      successIconColor: "text-zinc-900"
    },
    modern: {
      gradient: "bg-gradient-to-br from-slate-900 to-slate-950 border-b border-white/10",
      contentBg: "bg-slate-950 border border-white/10",
      titleColor: "text-white",
      textColor: "text-slate-400",
      labelColor: "text-slate-300",
      inputBg: "bg-slate-900",
      inputBorder: "border-white/10",
      inputFocus: "focus:border-white/30 focus:ring-white/20 text-white",
      primaryBtn: "bg-white text-black hover:bg-slate-200 shadow-lg shadow-white/10",
      secondaryBtn: "border-white/10 hover:bg-white/10 hover:text-white text-slate-300 bg-transparent",
      link: "text-white hover:text-slate-300",
      iconBox: "bg-white/10 border-white/10",
      iconColor: "text-white",
      divider: "bg-white/10 text-slate-600",
      successIconBg: "bg-white/10",
      successIconColor: "text-white"
    },
    premium: {
      gradient: "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-b border-[#c6a355]/20",
      contentBg: "bg-[#111]/95 border border-[#c6a355]/20",
      titleColor: "text-[#c6a355]",
      textColor: "text-zinc-400",
      labelColor: "text-zinc-300",
      inputBg: "bg-zinc-900/50",
      inputBorder: "border-zinc-800",
      inputFocus: "focus:border-[#c6a355] focus:ring-[#c6a355] text-[#e5e5e5]",
      primaryBtn: "bg-[#c6a355] hover:bg-[#d4b060] text-black shadow-[#c6a355]/20 hover:shadow-[#c6a355]/30",
      secondaryBtn: "border-[#c6a355]/30 hover:bg-[#c6a355]/10 hover:text-[#c6a355] hover:border-[#c6a355] bg-transparent text-[#c6a355]",
      link: "text-[#c6a355] hover:text-[#d4b060]",
      iconBox: "bg-[#c6a355]/10 border-[#c6a355]/20",
      iconColor: "text-[#c6a355]",
      divider: "bg-zinc-800 text-zinc-500",
      successIconBg: "bg-[#c6a355]/20",
      successIconColor: "text-[#c6a355]"
    },
    bistro: {
      gradient: "bg-gradient-to-br from-orange-50 to-stone-100 border-b border-stone-200",
      contentBg: "bg-[#f8f5e6]",
      titleColor: "text-stone-800 font-serif",
      textColor: "text-stone-600",
      labelColor: "text-stone-700",
      inputBg: "bg-white",
      inputBorder: "border-stone-200",
      inputFocus: "focus:border-orange-400 focus:ring-orange-200 text-stone-800",
      primaryBtn: "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20 hover:shadow-orange-500/30",
      secondaryBtn: "border-orange-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 bg-white text-orange-700",
      link: "text-orange-700 hover:text-orange-800",
      iconBox: "bg-orange-100 text-orange-600",
      iconColor: "text-orange-600",
      divider: "bg-stone-200 text-stone-400",
      successIconBg: "bg-orange-100",
      successIconColor: "text-orange-600"
    }
  };

  const styles = theme[variant] || theme.default;

  const handleGuestContinue = () => {
    setGuest(true);
    setAuthDialogOpen(false);
    toast.success('Hoş geldiniz! Menüyü inceleyebilirsiniz.');
  };

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const verifyForm = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: '',
      code: '',
    },
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '', code: '', newPassword: '' },
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/customer/login', data);
      setCustomer(response.data.customer, response.data.token);
      toast.success('Giriş başarılı! Hoş geldiniz.');
      setAuthDialogOpen(false);
      loginForm.reset();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { code?: string; message?: string; email?: string } } };
      if (apiError.response?.data?.code === 'NOT_VERIFIED') {
        toast.error('Hesabınız henüz doğrulanmamış. Lütfen doğrulama kodunu giriniz.');
        if (apiError.response.data.email) {
          setVerificationEmail(apiError.response.data.email);
          verifyForm.setValue('email', apiError.response.data.email);
        }
        setView('verification');
      } else {
        toast.error(apiError.response?.data?.message || 'Giriş yapılamadı');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/customer/register', data);
      if (response.data.requiresVerification) {
        toast.success('Kayıt başarılı! Lütfen e-posta adresinize gönderilen kodu giriniz.');
        setVerificationEmail(data.email);
        verifyForm.setValue('email', data.email);
        setView('verification');
        registerForm.reset();
      } else {
        setCustomer(response.data.customer, response.data.token);
        toast.success('Kayıt başarılı! Aramıza hoş geldiniz.');
        setAuthDialogOpen(false);
        registerForm.reset();
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Kayıt yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (data: z.infer<typeof verifySchema>) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/customer/verify', data);
      setCustomer(response.data.customer, response.data.token);
      toast.success('Hesap doğrulandı! Hoş geldiniz.');
      setAuthDialogOpen(false);
      verifyForm.reset();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Doğrulama başarısız');
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setLoading(true);
    try {
      await api.post('/auth/customer/forgot-password', data);
      toast.success('Şifre sıfırlama kodu e-postanıza gönderildi.');
      resetPasswordForm.setValue('email', data.email);
      setView('reset-password');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data: z.infer<typeof resetPasswordSchema>) => {
    setLoading(true);
    try {
      await api.post('/auth/customer/reset-password', data);
      toast.success('Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.');
      setView('login');
      resetPasswordForm.reset();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  const resetView = (open: boolean) => {
    setAuthDialogOpen(open);
    if (!open) {
      setTimeout(() => setView('welcome'), 300);
    }
  };

  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={resetView}>
      <DialogContent 
        className={cn(
          "sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl backdrop-blur-lg",
          styles.contentBg
        )}
        showCloseButton={false}
        overlayClassName="bg-black/5 backdrop-blur-[1px]"
        aria-describedby="auth-description"
      >
        <DialogTitle className="sr-only">Müşteri Girişi</DialogTitle>
        <div id="auth-description" className="sr-only">
          Müşteri giriş, kayıt veya misafir girişi seçenekleri
        </div>
        <div className="relative h-full flex flex-col">
          {/* Header Section - Dynamic based on view */}
          <div className={cn(
            "relative transition-all duration-500 ease-in-out flex flex-col items-center justify-center overflow-hidden",
            view === 'welcome' ? 'h-48' : 'h-32',
            styles.gradient
          )}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />
            </div>

            {view !== 'welcome' && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("absolute top-4 left-4 hover:bg-white/20", styles.iconColor)}
                onClick={() => setView('welcome')}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="z-10 flex flex-col items-center"
            >
              <div className={cn("p-3 rounded-2xl backdrop-blur-md mb-3 shadow-lg", styles.iconBox)}>
                <UtensilsCrossed className={cn("h-8 w-8", styles.iconColor)} />
              </div>
              <h2 className={cn("text-2xl font-bold tracking-tight", styles.titleColor)}>QR Team Cafe</h2>
              {view === 'welcome' && (
                <p className={cn("text-sm mt-1 font-medium", styles.textColor)}>Lezzetin Adresi</p>
              )}
            </motion.div>
          </div>

          {/* Content Section */}
          <div className="p-6 bg-transparent flex-1">
            <AnimatePresence mode="wait">
              {view === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center space-y-2 mb-6">
                    <h3 className={cn("text-xl font-semibold", styles.titleColor)}>Hoş Geldiniz!</h3>
                    <p className={cn("text-sm", styles.textColor)}>
                      Siparişinizi vermek için hemen menüyü incelemeye başlayın.
                    </p>
                  </div>

                  <Button 
                    size="lg" 
                    className={cn(
                      "w-full h-14 text-lg font-semibold transition-all group border-0",
                      styles.primaryBtn
                    )}
                    onClick={handleGuestContinue}
                  >
                    <Coffee className="mr-2 h-5 w-5" />
                    Menüyü İncele
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className={cn("w-full border-t", styles.inputBorder)} />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className={cn("backdrop-blur-sm px-2 rounded", styles.divider)}>veya</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="lg"
                    className={cn(
                      "w-full h-12 border-2 transition-colors",
                      styles.secondaryBtn
                    )}
                    onClick={() => setView('login')}
                  >
                    <UserCircle2 className="mr-2 h-5 w-5" />
                    Üye Girişi / Kayıt Ol
                  </Button>
                </motion.div>
              )}

              {view === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <h3 className={cn("text-lg font-semibold", styles.titleColor)}>Giriş Yap</h3>
                    <p className={cn("text-sm", styles.textColor)}>Hesabınıza erişin ve sipariş verin</p>
                  </div>

                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.labelColor}>E-posta</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ornek@email.com" 
                                {...field} 
                                className={cn(
                                  "h-11", 
                                  styles.inputBg, 
                                  styles.inputBorder, 
                                  styles.inputFocus
                                )} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.labelColor}>Şifre</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="******" 
                                {...field} 
                                className={cn(
                                  "h-11", 
                                  styles.inputBg, 
                                  styles.inputBorder, 
                                  styles.inputFocus
                                )} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          variant="link" 
                          className={cn("px-0 h-auto text-sm font-medium", styles.link)}
                          onClick={() => setView('forgot-password')}
                        >
                          Şifremi Unuttum?
                        </Button>
                      </div>

                      <Button type="submit" className={cn("w-full h-11", styles.primaryBtn)} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Giriş Yap
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className={cn("w-full border-t", styles.inputBorder)} />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className={cn("backdrop-blur-sm px-2 rounded", styles.divider)}>veya</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className={cn("w-full h-11 border-2", styles.secondaryBtn)}
                    onClick={() => setView('register')}
                  >
                    Yeni Hesap Oluştur
                  </Button>
                </motion.div>
              )}

              {view === 'forgot-password' && (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <h3 className={cn("text-lg font-semibold", styles.titleColor)}>Şifre Sıfırlama</h3>
                    <p className={cn("text-sm", styles.textColor)}>E-posta adresinize bir kod göndereceğiz</p>
                  </div>

                  <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                      <FormField
                        control={forgotPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.labelColor}>E-posta</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ornek@email.com" 
                                {...field} 
                                className={cn(
                                  "h-11", 
                                  styles.inputBg, 
                                  styles.inputBorder, 
                                  styles.inputFocus
                                )} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className={cn("w-full h-11", styles.primaryBtn)} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kod Gönder
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}

              {view === 'reset-password' && (
                <motion.div
                  key="reset-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <h3 className={cn("text-lg font-semibold", styles.titleColor)}>Yeni Şifre Belirle</h3>
                    <p className={cn("text-sm", styles.textColor)}>Gelen kodu ve yeni şifrenizi girin</p>
                  </div>

                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                      <FormField
                        control={resetPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.labelColor}>E-posta</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                readOnly 
                                className={cn(
                                  "h-11 opacity-50 cursor-not-allowed", 
                                  styles.inputBg, 
                                  styles.inputBorder
                                )} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={resetPasswordForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.labelColor}>Doğrulama Kodu</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="123456" 
                                {...field} 
                                maxLength={6} 
                                className={cn(
                                  "h-11 tracking-widest text-center text-lg", 
                                  styles.inputBg, 
                                  styles.inputBorder, 
                                  styles.inputFocus
                                )} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={resetPasswordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.labelColor}>Yeni Şifre</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="******" 
                                {...field} 
                                className={cn(
                                  "h-11", 
                                  styles.inputBg, 
                                  styles.inputBorder, 
                                  styles.inputFocus
                                )} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className={cn("w-full h-11", styles.primaryBtn)} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Şifreyi Güncelle
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}

              {view === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <h3 className={cn("text-lg font-semibold", styles.titleColor)}>Kayıt Ol</h3>
                    <p className={cn("text-sm", styles.textColor)}>Yeni bir hesap oluşturun</p>
                  </div>

                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.labelColor}>Ad Soyad</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Adınız Soyadınız" 
                                {...field} 
                                className={cn(
                                  "h-11", 
                                  styles.inputBg, 
                                  styles.inputBorder, 
                                  styles.inputFocus
                                )} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.labelColor}>E-posta</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ornek@email.com" 
                                {...field} 
                                className={cn(
                                  "h-11", 
                                  styles.inputBg, 
                                  styles.inputBorder, 
                                  styles.inputFocus
                                )} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.labelColor}>Telefon</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0555 555 55 55" 
                                {...field} 
                                className={cn(
                                  "h-11", 
                                  styles.inputBg, 
                                  styles.inputBorder, 
                                  styles.inputFocus
                                )} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.labelColor}>Şifre</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="******" 
                                {...field} 
                                className={cn(
                                  "h-11", 
                                  styles.inputBg, 
                                  styles.inputBorder, 
                                  styles.inputFocus
                                )} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className={cn("w-full h-11 text-base shadow-md", styles.primaryBtn)} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Kayıt Ol'}
                      </Button>
                    </form>
                  </Form>

                  <div className="text-center mt-4">
                    <p className={cn("text-sm", styles.textColor)}>
                      Zaten hesabınız var mı?{' '}
                      <button 
                        onClick={() => setView('login')} 
                        className={cn("font-semibold hover:underline", styles.link)}
                      >
                        Giriş Yap
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {view === 'verification' && (
                <motion.div
                  key="verification"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3", styles.successIconBg)}>
                      <MailCheck className={cn("h-6 w-6", styles.successIconColor)} />
                    </div>
                    <h3 className={cn("text-lg font-semibold", styles.titleColor)}>Hesabı Doğrula</h3>
                    <p className={cn("text-sm", styles.textColor)}>
                      <span className={cn("font-medium", styles.titleColor)}>{verificationEmail}</span> adresine gönderilen 6 haneli kodu giriniz
                    </p>
                  </div>

                  <Form {...verifyForm}>
                    <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-4">
                      <FormField
                        control={verifyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input {...field} type="hidden" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={verifyForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={cn("text-center block", styles.labelColor)}>Doğrulama Kodu</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="123456" 
                                {...field} 
                                className={cn(
                                  "h-14 text-center text-2xl tracking-[0.5em] font-bold", 
                                  styles.inputBg, 
                                  styles.inputBorder, 
                                  styles.inputFocus
                                )} 
                                maxLength={6}
                              />
                            </FormControl>
                            <FormMessage className="text-center" />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className={cn("w-full h-11 text-base shadow-md", styles.primaryBtn)} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Doğrula ve Giriş Yap'}
                      </Button>
                    </form>
                  </Form>

                  <div className="text-center mt-4">
                    <p className={cn("text-sm", styles.textColor)}>
                      Kod gelmedi mi?{' '}
                      <button 
                        onClick={() => toast.info('Kod tekrar gönderildi (Simülasyon)')} 
                        className={cn("font-semibold hover:underline", styles.link)}
                        type="button"
                      >
                        Tekrar Gönder
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
