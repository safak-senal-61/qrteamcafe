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
  UserPlus2, 
  ArrowRight, 
  ChevronLeft,
  ChefHat,
  Coffee,
  MailCheck,
  KeyRound
} from 'lucide-react';
import { useCustomerStore } from '@/store/customer-store';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
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

export function CustomerAuthDialog() {
  const { isAuthDialogOpen, setAuthDialogOpen, setCustomer, setGuest } = useCustomerStore();
  const [view, setView] = useState<AuthView>('welcome');
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

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
    } catch (error: any) {
      if (error.response?.data?.code === 'NOT_VERIFIED') {
        toast.error('Hesabınız henüz doğrulanmamış. Lütfen doğrulama kodunu giriniz.');
        setVerificationEmail(error.response.data.email);
        verifyForm.setValue('email', error.response.data.email);
        setView('verification');
      } else {
        toast.error(error.response?.data?.message || 'Giriş yapılamadı');
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kayıt yapılamadı');
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Doğrulama başarısız');
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
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
        className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl bg-white/75 backdrop-blur-lg"
        showCloseButton={false}
        overlayClassName="bg-black/5 backdrop-blur-[1px]"
        aria-describedby="auth-description"
      >
        <div id="auth-description" className="sr-only">
          Müşteri giriş, kayıt veya misafir girişi seçenekleri
        </div>
        <div className="relative h-full flex flex-col">
          {/* Header Section - Dynamic based on view */}
          <div className={`relative transition-all duration-500 ease-in-out ${view === 'welcome' ? 'h-48' : 'h-32'} bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-white overflow-hidden`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />
            </div>

            {view !== 'welcome' && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 text-white hover:bg-white/20 hover:text-white"
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
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md mb-3 shadow-lg border border-white/10">
                <UtensilsCrossed className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">QR Team Cafe</h2>
              {view === 'welcome' && (
                <p className="text-sm text-white/90 mt-1 font-medium">Lezzetin Adresi</p>
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
                    <h3 className="text-xl font-semibold text-gray-900">Hoş Geldiniz!</h3>
                    <p className="text-gray-500 text-sm">
                      Siparişinizi vermek için hemen menüyü incelemeye başlayın.
                    </p>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all group bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                    onClick={handleGuestContinue}
                  >
                    <Coffee className="mr-2 h-5 w-5" />
                    Menüyü İncele
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/50 backdrop-blur-sm px-2 text-gray-400">veya</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full h-12 border-2 border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors bg-white/50 text-emerald-600"
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
                    <h3 className="text-lg font-semibold text-gray-900">Giriş Yap</h3>
                    <p className="text-sm text-gray-500">Hesabınıza erişin ve sipariş verin</p>
                  </div>

                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">E-posta</FormLabel>
                            <FormControl>
                              <Input placeholder="ornek@email.com" {...field} className="h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Şifre</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} className="h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          variant="link" 
                          className="px-0 h-auto text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                          onClick={() => setView('forgot-password')}
                        >
                          Şifremi Unuttum?
                        </Button>
                      </div>

                      <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Giriş Yap
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/50 backdrop-blur-sm px-2 text-gray-400">veya</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
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
                    <h3 className="text-lg font-semibold text-gray-900">Şifre Sıfırlama</h3>
                    <p className="text-sm text-gray-500">E-posta adresinize bir kod göndereceğiz</p>
                  </div>

                  <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                      <FormField
                        control={forgotPasswordForm.control}
                        name="email"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">E-posta</FormLabel>
                            <FormControl>
                              <Input placeholder="ornek@email.com" {...field} className="h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
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
                    <h3 className="text-lg font-semibold text-gray-900">Yeni Şifre Belirle</h3>
                    <p className="text-sm text-gray-500">Gelen kodu ve yeni şifrenizi girin</p>
                  </div>

                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                      <FormField
                        control={resetPasswordForm.control}
                        name="email"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">E-posta</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="h-11 bg-gray-100 border-gray-200" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={resetPasswordForm.control}
                        name="code"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Doğrulama Kodu</FormLabel>
                            <FormControl>
                              <Input placeholder="123456" {...field} maxLength={6} className="h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 tracking-widest text-center text-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={resetPasswordForm.control}
                        name="newPassword"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Yeni Şifre</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} className="h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
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
                    <h3 className="text-lg font-semibold text-gray-900">Kayıt Ol</h3>
                    <p className="text-sm text-gray-500">Yeni bir hesap oluşturun</p>
                  </div>

                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Ad Soyad</FormLabel>
                            <FormControl>
                              <Input placeholder="Adınız Soyadınız" {...field} className="h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" />
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
                            <FormLabel className="text-gray-700">E-posta</FormLabel>
                            <FormControl>
                              <Input placeholder="ornek@email.com" {...field} className="h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" />
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
                            <FormLabel className="text-gray-700">Telefon</FormLabel>
                            <FormControl>
                              <Input placeholder="0555 555 55 55" {...field} className="h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" />
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
                            <FormLabel className="text-gray-700">Şifre</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} className="h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full h-11 text-base shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Kayıt Ol'}
                      </Button>
                    </form>
                  </Form>

                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-500">
                      Zaten hesabınız var mı?{' '}
                      <button 
                        onClick={() => setView('login')} 
                        className="text-emerald-600 font-semibold hover:underline"
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
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MailCheck className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Hesabı Doğrula</h3>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{verificationEmail}</span> adresine gönderilen 6 haneli kodu giriniz
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
                            <FormLabel className="text-gray-700 text-center block">Doğrulama Kodu</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="123456" 
                                {...field} 
                                className="h-14 text-center text-2xl tracking-[0.5em] font-bold bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" 
                                maxLength={6}
                              />
                            </FormControl>
                            <FormMessage className="text-center" />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full h-11 text-base shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Doğrula ve Giriş Yap'}
                      </Button>
                    </form>
                  </Form>

                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-500">
                      Kod gelmedi mi?{' '}
                      <button 
                        onClick={() => toast.info('Kod tekrar gönderildi (Simülasyon)')} 
                        className="text-emerald-600 font-semibold hover:underline"
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
