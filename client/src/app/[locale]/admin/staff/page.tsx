'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Check, X, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const fetchWaiters = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/waiters');
      setWaiters(res.data);
    } catch (error) {
      console.error('Waiters fetch error:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Personel listesi yüklenemedi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaiters();
  }, []);

  const handleUpdateStatus = async (id: string, status: string, role?: string) => {
    try {
      await api.patch(`/waiters/${id}/status`, { status, role });
      toast({
        title: 'Başarılı',
        description: 'Personel durumu güncellendi.',
      });
      fetchWaiters();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Güncelleme yapılamadı.',
      });
    }
  };

  const pendingWaiters = waiters.filter((w) => w.status === 'PENDING_APPROVAL');
  const activeWaiters = waiters.filter((w) => w.status === 'ACTIVE' || w.status === 'INACTIVE');

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'WAITER': return 'Garson';
      case 'HEAD_WAITER': return 'Şef Garson';
      case 'CASHIER_WAITER': return 'Kasiyer/Garson';
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
                          <Badge variant={waiter.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {waiter.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
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
                Sisteme kayıt olan ve onayınızı bekleyen garson adayları.
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
                      <TableHead>Telefon</TableHead>
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
                        <TableCell>{waiter.phone}</TableCell>
                        <TableCell>
                          {new Date(waiter.createdAt).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
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
