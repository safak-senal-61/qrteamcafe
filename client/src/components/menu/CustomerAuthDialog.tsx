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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
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

interface ThemeStyle {
  headerTitleColor?: string;
  headerTextColor?: string;
  titleColor: string;
  textColor: string;
  labelColor: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  primaryBtn: string;
  secondaryBtn: string;
  link: string;
  iconBox: string;
  iconColor: string;
  divider: string;
  successIconBg: string;
  successIconColor: string;
  gradient: string;
  contentBg: string;
  [key: string]: string | undefined;
}

export function CustomerAuthDialog({ variant = 'default' }: CustomerAuthDialogProps) {
  const { isAuthDialogOpen, setAuthDialogOpen, setCustomer, setGuest } = useCustomerStore();
  const [view, setView] = useState<AuthView>('welcome');
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const theme: Record<string, ThemeStyle> = {
    default: {
      gradient: "bg-white",
      contentBg: "bg-white",
      headerTitleColor: "text-primary text-3xl",
      headerTextColor: "text-muted-foreground/80",
      titleColor: "text-foreground",
      textColor: "text-muted-foreground",
      labelColor: "text-foreground/80",
      inputBg: "bg-secondary/30",
      inputBorder: "border-border/40",
      inputFocus: "focus:border-primary focus:ring-primary",
      primaryBtn: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl h-12",
      secondaryBtn: "bg-white text-foreground hover:bg-secondary/50 border border-input/50 rounded-xl h-12",
      link: "text-primary font-medium hover:text-primary/80",
      iconBox: "bg-primary/5 border-primary/10",
      iconColor: "text-primary",
      divider: "bg-border/40 text-muted-foreground/60",
      successIconBg: "bg-primary/10",
      successIconColor: "text-primary"
    },
    premium: {
      gradient: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
      contentBg: "bg-slate-900/95 border-slate-700/50",
      headerTitleColor: "text-white text-3xl",
      headerTextColor: "text-slate-400",
      titleColor: "text-white",
      textColor: "text-slate-400",
      labelColor: "text-slate-300",
      inputBg: "bg-slate-800/50",
      inputBorder: "border-slate-700",
      inputFocus: "focus:border-amber-500/50 focus:ring-amber-500/20",
      primaryBtn: "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-900/20 rounded-xl h-12",
      secondaryBtn: "bg-transparent text-slate-300 hover:bg-slate-800/50 border border-slate-700 rounded-xl h-12",
      link: "text-amber-500 font-medium hover:text-amber-400",
      iconBox: "bg-amber-500/10 border-amber-500/20",
      iconColor: "text-amber-500",
      divider: "bg-slate-700 text-slate-500",
      successIconBg: "bg-amber-500/10",
      successIconColor: "text-amber-500"
    },
    bistro: {
      gradient: "bg-stone-50",
      contentBg: "bg-[#FDFBF7] border-stone-200",
      headerTitleColor: "text-stone-800 text-3xl font-serif",
      headerTextColor: "text-stone-600",
      titleColor: "text-stone-800",
      textColor: "text-stone-600",
      labelColor: "text-stone-700",
      inputBg: "bg-white",
      inputBorder: "border-stone-200",
      inputFocus: "focus:border-orange-500/50 focus:ring-orange-500/20",
      primaryBtn: "bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-900/10 rounded-xl h-12 font-medium",
      secondaryBtn: "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 rounded-xl h-12",
      link: "text-orange-600 font-medium hover:text-orange-700",
      iconBox: "bg-orange-100 border-orange-200",
      iconColor: "text-orange-600",
      divider: "bg-stone-200 text-stone-400",
      successIconBg: "bg-orange-100",
      successIconColor: "text-orange-600"
    },
    modern: {
      gradient: "bg-white",
      contentBg: "bg-white/80 backdrop-blur-xl border-white/20",
      headerTitleColor: "text-gray-900 text-3xl tracking-tight",
      headerTextColor: "text-gray-500",
      titleColor: "text-gray-900",
      textColor: "text-gray-500",
      labelColor: "text-gray-700",
      inputBg: "bg-gray-50/50",
      inputBorder: "border-gray-200",
      inputFocus: "focus:border-blue-500/50 focus:ring-blue-500/20",
      primaryBtn: "bg-gray-900 text-white hover:bg-gray-800 shadow-xl shadow-gray-900/10 rounded-2xl h-12",
      secondaryBtn: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-2xl h-12",
      link: "text-blue-600 font-medium hover:text-blue-700",
      iconBox: "bg-blue-50 border-blue-100",
      iconColor: "text-blue-600",
      divider: "bg-gray-100 text-gray-400",
      successIconBg: "bg-blue-50",
      successIconColor: "text-blue-600"
    },
    classic: {
      gradient: "bg-gray-50",
      contentBg: "bg-white border-gray-200 shadow-2xl",
      headerTitleColor: "text-gray-900 text-3xl font-serif",
      headerTextColor: "text-gray-600",
      titleColor: "text-gray-900",
      textColor: "text-gray-600",
      labelColor: "text-gray-700",
      inputBg: "bg-white",
      inputBorder: "border-gray-300",
      inputFocus: "focus:border-gray-900 focus:ring-gray-900/10",
      primaryBtn: "bg-gray-900 text-white hover:bg-gray-800 rounded-md h-12 uppercase tracking-wide text-sm font-semibold",
      secondaryBtn: "bg-white text-gray-900 hover:bg-gray-50 border border-gray-300 rounded-md h-12 uppercase tracking-wide text-sm font-semibold",
      link: "text-gray-900 font-semibold hover:underline decoration-2 underline-offset-4",
      iconBox: "bg-gray-100 border-gray-200",
      iconColor: "text-gray-900",
      divider: "bg-gray-200 text-gray-400",
      successIconBg: "bg-gray-100",
      successIconColor: "text-gray-900"
    },
    minimal: {
      gradient: "bg-white",
      contentBg: "bg-white border-0 shadow-none",
      headerTitleColor: "text-black text-4xl font-light tracking-tight",
      headerTextColor: "text-gray-400",
      titleColor: "text-black",
      textColor: "text-gray-500",
      labelColor: "text-black font-medium",
      inputBg: "bg-gray-50",
      inputBorder: "border-transparent",
      inputFocus: "focus:bg-white focus:border-black focus:ring-0",
      primaryBtn: "bg-black text-white hover:bg-gray-900 rounded-full h-12 font-medium",
      secondaryBtn: "bg-white text-black hover:bg-gray-50 border border-gray-200 rounded-full h-12 font-medium",
      link: "text-black font-medium border-b border-black hover:border-gray-500 pb-0.5",
      iconBox: "bg-gray-50",
      iconColor: "text-black",
      divider: "bg-gray-100 text-gray-300",
      successIconBg: "bg-gray-50",
      successIconColor: "text-black"
    }
  };

  const styles = theme[variant] || theme.default;
  
  // Safe fallbacks for optional properties
  const headerTitleColor = styles.headerTitleColor || styles.titleColor;
  const headerTextColor = styles.headerTextColor || styles.textColor;

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
    defaultValues: {
      email: '',
    },
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
      code: '',
      newPassword: '',
    },
  });

  async function onLogin(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    try {
      const res = await api.post('/auth/customer/login', values);
      setCustomer(res.data.customer, res.data.token);
      setAuthDialogOpen(false);
      toast.success('Giriş başarılı');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Giriş yapılamadı');
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(values: z.infer<typeof registerSchema>) {
    setLoading(true);
    try {
      await api.post('/auth/customer/register', values);
      setVerificationEmail(values.email);
      setView('verification');
      verifyForm.setValue('email', values.email);
      toast.success('Kayıt başarılı, lütfen e-posta adresinizi doğrulayın');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kayıt yapılamadı');
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(values: z.infer<typeof verifySchema>) {
    setLoading(true);
    try {
      const res = await api.post('/auth/customer/verify', values);
      setCustomer(res.data.customer, res.data.token);
      setAuthDialogOpen(false);
      toast.success('Doğrulama başarılı');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Doğrulama başarısız');
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword(values: z.infer<typeof forgotPasswordSchema>) {
    setLoading(true);
    try {
      await api.post('/auth/customer/forgot-password', values);
      setVerificationEmail(values.email);
      setView('reset-password');
      resetPasswordForm.setValue('email', values.email);
      toast.success('Şifre sıfırlama kodu gönderildi');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword(values: z.infer<typeof resetPasswordSchema>) {
    setLoading(true);
    try {
      await api.post('/auth/customer/reset-password', values);
      setView('login');
      toast.success('Şifreniz başarıyla değiştirildi, giriş yapabilirsiniz');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Şifre sıfırlama başarısız');
    } finally {
      setLoading(false);
    }
  }

  const handleGuestContinue = () => {
    setGuest(true);
    setAuthDialogOpen(false);
  };

  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={setAuthDialogOpen}>
      <DialogContent className={cn("sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl gap-0", styles.contentBg)}>
        <DialogTitle className="sr-only">Müşteri Girişi</DialogTitle>
        <div className="relative">
          {/* Header Pattern/Gradient */}
          <div className={cn("absolute top-0 inset-x-0 h-32 opacity-50", styles.gradient)} />
          
          <div className="relative px-6 pt-8 pb-6">
            <AnimatePresence mode="wait">
              {view === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <div className={cn("mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3", styles.iconBox)}>
                      <UtensilsCrossed className={cn("w-8 h-8", styles.iconColor)} />
                    </div>
                    <h2 className={cn("font-bold tracking-tight", headerTitleColor)}>Hoş Geldiniz</h2>
                    <p className={cn("text-lg", headerTextColor)}>
                      Sipariş vermek için giriş yapın veya misafir olarak devam edin.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button 
                      onClick={() => setView('login')}
                      className={cn("w-full h-14 text-base font-semibold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]", styles.primaryBtn)}
                    >
                      <UserCircle2 className="mr-2 h-5 w-5" />
                      Giriş Yap / Kayıt Ol
                    </Button>
                    
                    <div className="relative py-3">
                      <div className="absolute inset-0 flex items-center">
                        <span className={cn("w-full border-t", styles.divider)} />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className={cn("px-2 rounded-full font-medium", styles.contentBg, styles.textColor)}>veya</span>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={handleGuestContinue}
                      className={cn("w-full h-14 text-base font-medium border-2 hover:bg-secondary/50 transition-all hover:scale-[1.02] active:scale-[0.98]", styles.secondaryBtn)}
                    >
                      Misafir Olarak Devam Et
                      <ArrowRight className="ml-2 h-5 w-5 opacity-50" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {view === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className={cn("text-2xl font-semibold mb-2", styles.titleColor)}>Giriş Yap</h3>
                    <p className={styles.textColor}>Hesabınıza erişmek için bilgilerinizi girin</p>
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
                                  "h-12", 
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
                                  "h-12", 
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
                          className={cn("px-0 h-auto text-sm font-medium hover:no-underline opacity-80 hover:opacity-100", styles.link)}
                          onClick={() => setView('forgot-password')}
                        >
                          Şifremi Unuttum?
                        </Button>
                      </div>

                      <Button type="submit" className={cn("w-full h-12 text-base font-semibold", styles.primaryBtn)} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Giriş Yap'}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className={cn("w-full border-t", styles.divider)} />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className={cn("px-2 rounded font-medium", styles.contentBg, styles.textColor)}>Hesabınız yok mu?</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className={cn("w-full h-12 border-2 font-medium", styles.secondaryBtn)}
                    onClick={() => setView('register')}
                  >
                    Yeni Hesap Oluştur
                  </Button>
                </motion.div>
              )}

              {view === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className={cn("text-2xl font-semibold mb-2", styles.titleColor)}>Kayıt Ol</h3>
                    <p className={styles.textColor}>Hızlıca sipariş vermek için hesap oluşturun</p>
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
                                  "h-12", 
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
                                  "h-12", 
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
                                  "h-12", 
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
                                  "h-12", 
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
                      
                      <Button type="submit" className={cn("w-full h-12 text-base font-semibold mt-2", styles.primaryBtn)} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Kayıt Ol'}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className={cn("w-full border-t", styles.divider)} />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className={cn("px-2 rounded font-medium", styles.contentBg, styles.textColor)}>Hesabınız var mı?</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className={cn("w-full h-12 border-2 font-medium", styles.secondaryBtn)}
                    onClick={() => setView('login')}
                  >
                    Giriş Yap
                  </Button>
                </motion.div>
              )}

              {view === 'verification' && (
                <motion.div
                  key="verification"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <div className={cn("mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4", styles.successIconBg)}>
                      <MailCheck className={cn("w-8 h-8", styles.successIconColor)} />
                    </div>
                    <h3 className={cn("text-2xl font-semibold mb-2", styles.titleColor)}>E-posta Doğrulama</h3>
                    <p className={styles.textColor}>
                      <span className="font-medium text-foreground">{verificationEmail}</span> adresine gönderilen 6 haneli kodu giriniz.
                    </p>
                  </div>

                  <Form {...verifyForm}>
                    <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-6">
                      <FormField
                        control={verifyForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex justify-center">
                                <InputOTP
                                  maxLength={6}
                                  value={field.value}
                                  onChange={field.onChange}
                                  containerClassName={cn("justify-center", styles.inputFocus)}
                                >
                                  <InputOTPGroup className={styles.inputBg}>
                                    <InputOTPSlot index={0} className={styles.inputBorder} />
                                    <InputOTPSlot index={1} className={styles.inputBorder} />
                                    <InputOTPSlot index={2} className={styles.inputBorder} />
                                  </InputOTPGroup>
                                  <InputOTPSeparator />
                                  <InputOTPGroup className={styles.inputBg}>
                                    <InputOTPSlot index={3} className={styles.inputBorder} />
                                    <InputOTPSlot index={4} className={styles.inputBorder} />
                                    <InputOTPSlot index={5} className={styles.inputBorder} />
                                  </InputOTPGroup>
                                </InputOTP>
                              </div>
                            </FormControl>
                            <FormMessage className="text-center" />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className={cn("w-full h-12 text-base font-semibold", styles.primaryBtn)} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Doğrula'}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}

              {view === 'forgot-password' && (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className={cn("text-2xl font-semibold mb-2", styles.titleColor)}>Şifre Sıfırlama</h3>
                    <p className={styles.textColor}>E-posta adresinize bir kod göndereceğiz</p>
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
                                  "h-12", 
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
                      
                      <Button type="submit" className={cn("w-full h-12 text-base font-semibold", styles.primaryBtn)} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Kod Gönder'}
                      </Button>
                    </form>
                  </Form>

                  <div className="text-center">
                    <Button 
                      variant="link" 
                      onClick={() => setView('login')}
                      className={cn("text-sm", styles.link)}
                    >
                      Giriş sayfasına dön
                    </Button>
                  </div>
                </motion.div>
              )}

              {view === 'reset-password' && (
                <motion.div
                  key="reset-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className={cn("text-2xl font-semibold mb-2", styles.titleColor)}>Yeni Şifre Belirle</h3>
                    <p className={styles.textColor}>
                      Lütfen kodunuzu ve yeni şifrenizi giriniz
                    </p>
                  </div>

                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                      <FormField
                        control={resetPasswordForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.labelColor}>Doğrulama Kodu</FormLabel>
                            <FormControl>
                              <div className="flex justify-center">
                                <InputOTP
                                  maxLength={6}
                                  value={field.value}
                                  onChange={field.onChange}
                                  containerClassName={cn("justify-start", styles.inputFocus)}
                                >
                                  <InputOTPGroup className={styles.inputBg}>
                                    <InputOTPSlot index={0} className={styles.inputBorder} />
                                    <InputOTPSlot index={1} className={styles.inputBorder} />
                                    <InputOTPSlot index={2} className={styles.inputBorder} />
                                  </InputOTPGroup>
                                  <InputOTPSeparator />
                                  <InputOTPGroup className={styles.inputBg}>
                                    <InputOTPSlot index={3} className={styles.inputBorder} />
                                    <InputOTPSlot index={4} className={styles.inputBorder} />
                                    <InputOTPSlot index={5} className={styles.inputBorder} />
                                  </InputOTPGroup>
                                </InputOTP>
                              </div>
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
                                  "h-12", 
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
                      
                      <Button type="submit" className={cn("w-full h-12 text-base font-semibold", styles.primaryBtn)} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Şifreyi Güncelle'}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Back Button (only show if not on welcome) */}
          {view !== 'welcome' && (
            <div className={cn("p-4 border-t bg-muted/5", styles.divider)}>
              <Button 
                variant="ghost" 
                onClick={() => setView('welcome')}
                className={cn("w-full text-muted-foreground hover:text-foreground", styles.textColor)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Ana Menüye Dön
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
