'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const formSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  phone: z.string().optional(),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  nationalId: z.string().optional(),
  cafeId: z.string().min(1, 'Lütfen çalışacağınız işletmeyi seçiniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

interface Cafe {
  id: string;
  name: string;
  city: string;
  district: string;
}

export default function WaiterRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [step, setStep] = useState<'REGISTER' | 'VERIFY'>('REGISTER');
  const [emailToVerify, setEmailToVerify] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      nationalId: '',
      cafeId: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const fetchCafes = async () => {
        try {
            const res = await api.get('/cafes');
            setCafes(res.data);
        } catch (error) {
            console.error('Cafes fetch error:', error);
        }
    };
    fetchCafes();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await api.post('/waiters/register', {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        email: values.email,
        nationalId: values.nationalId || undefined,
        cafeId: values.cafeId,
        password: values.password,
      });

      toast({
        title: 'Kayıt Başarılı',
        description: 'Doğrulama kodu e-posta adresinize gönderildi.',
      });

      setEmailToVerify(values.email);
      setStep('VERIFY');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.response?.data?.message || 'Kayıt olurken bir hata oluştu.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerify() {
    if (verificationCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Lütfen 6 haneli doğrulama kodunu giriniz.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/waiters/verify-email', {
        email: emailToVerify,
        code: verificationCode,
      });

      toast({
        title: 'Doğrulama Başarılı',
        description: 'E-posta adresiniz doğrulandı. Yönetici onayı bekleniyor.',
      });

      router.push('/waiter/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.response?.data?.message || 'Doğrulama başarısız.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    setIsLoading(true);
    try {
      await api.post('/waiters/resend-code', {
        email: emailToVerify,
      });

      toast({
        title: 'Kod Gönderildi',
        description: 'Yeni doğrulama kodu e-posta adresinize gönderildi.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.response?.data?.message || 'Kod gönderilemedi.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (step === 'VERIFY') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Doğrulama Kodu</CardTitle>
            <CardDescription className="text-center">
              Lütfen {emailToVerify} adresine gönderilen 6 haneli kodu giriniz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            <InputOTP
              maxLength={6}
              value={verificationCode}
              onChange={(value) => setVerificationCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <div className="flex flex-col gap-2 w-full">
              <Button onClick={handleVerify} disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Doğrula
              </Button>
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={isLoading}
                className="w-full"
              >
                Kodu Tekrar Gönder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Garson Kaydı</CardTitle>
          <CardDescription className="text-center">
            QR Team Cafe sistemine garson olarak kaydolun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad</FormLabel>
                      <FormControl>
                        <Input placeholder="Adınız" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soyad</FormLabel>
                      <FormControl>
                        <Input placeholder="Soyadınız" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input placeholder="ornek@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon (İsteğe bağlı)</FormLabel>
                    <FormControl>
                      <Input placeholder="0555..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>T.C. Kimlik No (İsteğe bağlı)</FormLabel>
                    <FormControl>
                      <Input placeholder="11 haneli kimlik no" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cafeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İşletme</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="İşletme seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cafes.map((cafe) => (
                          <SelectItem key={cafe.id} value={cafe.id}>
                            {cafe.name} ({cafe.city}/{cafe.district})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre Tekrar</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Kayıt Ol
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            Zaten hesabınız var mı?{' '}
            <Link href="/waiter/login" className="text-primary hover:underline">
              Giriş Yap
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
