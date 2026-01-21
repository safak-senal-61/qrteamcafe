'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, KeyRound, Loader2, Smartphone, Laptop, Trash2, QrCode, CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

interface Session {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  createdAt: string;
}

export default function SecuritySettings() {
  const [loading, setLoading] = useState(false);
  
  // Password Change State
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [is2FALoading, setIs2FALoading] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    fetchSessions();
    check2FAStatus();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const check2FAStatus = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const user = await res.json();
        // Update local storage to keep it fresh
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...localUser, ...user }));
        
        setIs2FAEnabled(!!user.isTwoFactorEnabled);
      } else {
        // Fallback to local storage
        checkLocal2FAStatus();
      }
    } catch (error) {
      console.error('Check 2FA status error:', error);
      checkLocal2FAStatus();
    }
  };

  const checkLocal2FAStatus = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.isTwoFactorEnabled) {
                setIs2FAEnabled(true);
            }
        } catch (e) {}
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    const token = getToken();
    if (!token) {
        setLoadingSessions(false);
        return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Sessions fetch error:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleGenerate2FA = async () => {
    setIs2FALoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/auth/2fa/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQrCodeUrl(data.qrCodeUrl);
        setIs2FAModalOpen(true);
      } else {
        toast.error('2FA oluşturulamadı.');
      }
    } catch (error) {
      toast.error('Bir hata oluştu.');
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!twoFactorCode) {
        toast.error('Lütfen kodu girin.');
        return;
    }
    setIs2FALoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/auth/2fa/enable`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ code: twoFactorCode })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setIs2FAEnabled(true);
        setIs2FAModalOpen(false);
        setTwoFactorCode('');
        
        // Update local storage user
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            user.isTwoFactorEnabled = true;
            localStorage.setItem('user', JSON.stringify(user));
        }
      } else {
        toast.error(data.message || 'Etkinleştirilemedi.');
      }
    } catch (error) {
      toast.error('Bir hata oluştu.');
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('2 Faktörlü doğrulamayı devre dışı bırakmak istediğinize emin misiniz?')) return;
    
    setIs2FALoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/auth/2fa/disable`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('2FA devre dışı bırakıldı.');
        setIs2FAEnabled(false);
        
        // Update local storage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            user.isTwoFactorEnabled = false;
            localStorage.setItem('user', JSON.stringify(user));
        }
      } else {
        toast.error('İşlem başarısız.');
      }
    } catch (error) {
      toast.error('Bir hata oluştu.');
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm('Bu oturumu sonlandırmak istediğinize emin misiniz?')) return;
    
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Oturum sonlandırıldı.');
        fetchSessions();
      } else {
        toast.error('Oturum sonlandırılamadı.');
      }
    } catch (error) {
      toast.error('Bir hata oluştu.');
    }
  };

  const handleTerminateAllOther = async () => {
    if (!confirm('Diğer tüm cihazlardaki oturumları kapatmak istediğinize emin misiniz?')) return;
    
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/auth/sessions`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Diğer oturumlar kapatıldı.');
        fetchSessions();
      } else {
        toast.error('İşlem başarısız.');
      }
    } catch (error) {
      toast.error('Bir hata oluştu.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Yeni şifreler uyuşmuyor.');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      toast.error('Oturum bilgisi bulunamadı.');
      return;
    }

    const user = JSON.parse(userStr);
    const userId = user.id;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(data.message || 'Şifre değiştirilemedi.');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Şifre Değiştirme
        </CardTitle>
        <CardDescription>
          Hesap şifrenizi buradan güncelleyebilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Mevcut Şifre</Label>
            <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    id="oldPassword"
                    type="password"
                    placeholder="********"
                    className="pl-9"
                    value={formData.oldPassword}
                    onChange={handleChange}
                />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="newPassword"
                        type="password"
                        placeholder="********"
                        className="pl-9"
                        value={formData.newPassword}
                        onChange={handleChange}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="********"
                        className="pl-9"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />
                </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handlePasswordChange} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Şifreyi Güncelle
            </Button>
          </div>
      </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                İki Faktörlü Doğrulama (2FA)
            </CardTitle>
            <CardDescription>
                Hesap güvenliğinizi artırmak için Google Authenticator kullanın.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/5">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Smartphone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-medium">Google Authenticator</h3>
                        <p className="text-sm text-muted-foreground">
                            {is2FAEnabled ? 'Hesabınız 2FA ile korunuyor.' : 'Henüz etkinleştirilmedi.'}
                        </p>
                    </div>
                </div>
                <div>
                    {is2FAEnabled ? (
                        <Button variant="destructive" onClick={handleDisable2FA} disabled={is2FALoading}>
                            {is2FALoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Devre Dışı Bırak'}
                        </Button>
                    ) : (
                        <Dialog open={is2FAModalOpen} onOpenChange={setIs2FAModalOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={handleGenerate2FA} disabled={is2FALoading}>
                                    {is2FALoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Etkinleştir'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>2FA Kurulumu</DialogTitle>
                                    <DialogDescription>
                                        Aşağıdaki QR kodu Google Authenticator uygulamanızla taratın ve üretilen kodu girin.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                                    {qrCodeUrl && (
                                        <div className="p-4 bg-white rounded-lg shadow-sm border">
                                            <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                                        </div>
                                    )}
                                    <div className="w-full max-w-xs space-y-2">
                                        <Label>Doğrulama Kodu</Label>
                                        <Input 
                                            placeholder="123456" 
                                            className="text-center text-lg tracking-widest" 
                                            value={twoFactorCode}
                                            onChange={(e) => setTwoFactorCode(e.target.value)}
                                            maxLength={6}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleEnable2FA} disabled={is2FALoading || twoFactorCode.length !== 6}>
                                        {is2FALoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Doğrula ve Etkinleştir
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5" />
                Aktif Oturumlar
            </CardTitle>
            <CardDescription>
                Hesabınıza giriş yapılmış cihazları yönetin.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {loadingSessions ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-secondary rounded-full">
                                    {session.device?.toLowerCase().includes('mobile') ? (
                                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <Laptop className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm">{session.device || 'Bilinmeyen Cihaz'}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>IP: {session.ip}</span>
                                        <span>•</span>
                                        <span>Son görülme: {new Date(session.lastActive).toLocaleString('tr-TR')}</span>
                                    </div>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={() => handleTerminateSession(session.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            Aktif oturum bulunamadı.
                        </div>
                    )}

                    {sessions.length > 1 && (
                        <div className="flex justify-end pt-4 border-t">
                            <Button variant="destructive" size="sm" onClick={handleTerminateAllOther}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Diğer Tüm Oturumları Kapat
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
    </Card>
    </div>
  );
}