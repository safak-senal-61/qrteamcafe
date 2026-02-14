'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface InviteInfo {
  firstName: string;
  lastName: string;
  cafeName: string;
  role: string;
}

export default function CompleteRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.post('/waiters/verify-invitation', { token });
        setInviteInfo(res.data);
        setIsValid(true);
      } catch (error: unknown) {
        console.error(error);
        setIsValid(false);
        const err = error as { response?: { data?: { message?: string } } };
        setErrorMessage(err.response?.data?.message || 'Bu davet bağlantısı geçersiz veya süresi dolmuş.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Şifreler eşleşmiyor.',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Şifre en az 6 karakter olmalıdır.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/waiters/complete-registration', {
        token,
        password,
      });

      toast({
        title: 'Başarılı',
        description: 'Hesabınız oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz.',
      });

      setTimeout(() => {
        router.push('/waiter/login');
      }, 2000);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Kayıt işlemi başarısız oldu.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || !isValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Davet Geçersiz</CardTitle>
            <CardDescription>
              {errorMessage || 'Bu davet bağlantısı geçersiz veya süresi dolmuş. Lütfen yöneticinizden yeni bir davet isteyin.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Şifre Belirleme</CardTitle>
          <CardDescription>
            Sn. {inviteInfo?.firstName} {inviteInfo?.lastName}, {inviteInfo?.cafeName} ekibine {inviteInfo?.role === 'KITCHEN' ? 'Mutfak Personeli' : 'Garson'} olarak katılmak için lütfen şifrenizi belirleyin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="En az 6 karakter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Şifrenizi tekrar girin"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Şifreyi Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
