'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface Waiter {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  role: string | null;
  createdAt: string;
}

export default function StaffPage() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'WAITER',
  });

  const fetchWaiters = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/waiters');
      setWaiters(res.data);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Personel listesi yüklenemedi.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWaiters();
  }, [fetchWaiters]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/waiters/invite', inviteForm);
      toast({
        title: 'Başarılı',
        description: 'Davet gönderildi.',
      });
      setIsInviteOpen(false);
      setInviteForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'WAITER',
      });
      fetchWaiters();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: err.response?.data?.message || 'Davet gönderilemedi.',
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: string, role?: string) => {
    try {
      await api.patch(`/waiters/${id}/status`, { status, role });
      toast({
        title: 'Başarılı',
        description: 'Personel durumu güncellendi.',
      });
      fetchWaiters();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Güncelleme yapılamadı.',
      });
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      await api.post(`/waiters/${id}/resend-invitation`);
      toast({
        title: 'Başarılı',
        description: 'Davet tekrar gönderildi.',
      });
      fetchWaiters();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Davet gönderilemedi.',
      });
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    if (!confirm('Bu daveti/başvuruyu silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/waiters/${id}`);
      toast({
        title: 'Başarılı',
        description: 'Davet silindi.',
      });
      fetchWaiters();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Silme işlemi başarısız.',
      });
    }
  };

  const pendingWaiters = waiters.filter((w) => ['PENDING_APPROVAL', 'INVITED'].includes(w.status));
  const activeWaiters = waiters.filter((w) => ['ACTIVE', 'INACTIVE'].includes(w.status));

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'WAITER': return 'Garson';
      case 'HEAD_WAITER': return 'Şef Garson';
      case 'CASHIER_WAITER': return 'Kasiyer/Garson';
      case 'KITCHEN': return 'Mutfak Personeli';
      default: return 'Rol Atanmamış';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Personel Yönetimi</h2>
          <p className="text-muted-foreground">
            Garson başvurularını yönetin ve yetkilendirin.
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Davet Gönder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Personel Davet Et</DialogTitle>
              <DialogDescription>
                Yeni bir personel davet etmek için bilgileri girin.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input
                    id="firstName"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input
                    id="lastName"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon (Opsiyonel)</Label>
                <Input
                  id="phone"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WAITER">Garson</SelectItem>
                    <SelectItem value="KITCHEN">Mutfak Personeli</SelectItem>
                    <SelectItem value="HEAD_WAITER">Şef Garson</SelectItem>
                    <SelectItem value="CASHIER_WAITER">Kasiyer/Garson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">Davet Gönder</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Çalışanlar ({activeWaiters.length})</TabsTrigger>
          <TabsTrigger value="pending">Onay Bekleyenler ({pendingWaiters.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personel Listesi</CardTitle>
              <CardDescription>
                Şu an çalışmakta olan veya pasif durumdaki personeliniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : activeWaiters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Kayıtlı personel bulunmuyor.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ad Soyad</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeWaiters.map((waiter) => (
                      <TableRow key={waiter.id}>
                        <TableCell className="font-medium">
                          {waiter.firstName} {waiter.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getRoleLabel(waiter.role)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            waiter.status === 'ACTIVE' ? 'default' : 
                            waiter.status === 'INVITED' ? 'outline' : 'secondary'
                          }>
                            {waiter.status === 'ACTIVE' ? 'Aktif' : 
                             waiter.status === 'INVITED' ? 'Davet Edildi' : 'Pasif'}
                          </Badge>
                        </TableCell>
                        <TableCell>{waiter.phone}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Shield className="w-4 h-4 mr-2" /> Rol Ata
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(waiter.id, 'ACTIVE', 'WAITER')}>
                                Garson
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(waiter.id, 'ACTIVE', 'HEAD_WAITER')}>
                                Şef Garson
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(waiter.id, 'ACTIVE', 'CASHIER_WAITER')}>
                                Kasiyer/Garson
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {waiter.status === 'ACTIVE' ? (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleUpdateStatus(waiter.id, 'INACTIVE', waiter.role || 'WAITER')}
                            >
                              Pasife Al
                            </Button>
                          ) : (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleUpdateStatus(waiter.id, 'ACTIVE', waiter.role || 'WAITER')}
                            >
                              Aktif Et
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Onay Bekleyen Başvurular</CardTitle>
              <CardDescription>
                Davet edilen veya başvuru yapan personeller.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : pendingWaiters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Bekleyen başvuru yok.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ad Soyad</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Başvuru Tarihi</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingWaiters.map((waiter) => (
                      <TableRow key={waiter.id}>
                        <TableCell className="font-medium">
                          {waiter.firstName} {waiter.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getRoleLabel(waiter.role)}</Badge>
                        </TableCell>
                         <TableCell>
                          <Badge variant={waiter.status === 'INVITED' ? 'outline' : 'secondary'}>
                            {waiter.status === 'INVITED' ? 'Davet Edildi' : 'Onay Bekliyor'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(waiter.createdAt).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {waiter.status === 'INVITED' ? (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleResendInvitation(waiter.id)}
                              >
                                Tekrar Gönder
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteInvitation(waiter.id)}
                              >
                                <X className="w-4 h-4 mr-1" /> İptal Et
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleUpdateStatus(waiter.id, 'ACTIVE', 'WAITER')}
                              >
                                <Check className="w-4 h-4 mr-1" /> Onayla
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleUpdateStatus(waiter.id, 'REJECTED')}
                              >
                                <X className="w-4 h-4 mr-1" /> Reddet
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
