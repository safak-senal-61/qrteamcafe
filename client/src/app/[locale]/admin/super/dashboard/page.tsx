'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  Store, 
  Calendar, 
  Phone, 
  Mail, 
  User, 
  RefreshCw, 
  LogOut, 
  Loader2,
  Search,
  Activity,
  AlertCircle,
  Users,
  Settings,
  Power,
  Globe,
  BellRing,
  Gift
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from '@/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { API_URL } from '@/lib/api';
import { RewardsManagement } from '@/components/admin/RewardsManagement';

interface CafeAdmin {
  id: string;
  name: string;
  email: string;
}

interface Cafe {
  id: string;
  name: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  createdAt: string;
  admins: CafeAdmin[];
}

interface DashboardStats {
  totalCafes: number;
  pendingCafes: number;
  activeCafes: number;
  rejectedCafes: number;
  totalUsers: number;
}

interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  globalAnnouncement: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    allowRegistrations: true,
    globalAnnouncement: ''
  });
  const [loading, setLoading] = useState(true);
  // Change processingId to store both ID and Action
  const [processingState, setProcessingState] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Cafes
      const cafesRes = await fetch(`${API_URL}/super-admin/cafes`);
      if (cafesRes.ok) {
        const data = await cafesRes.json();
        setCafes(data);
      }

      // Fetch Stats
      const statsRes = await fetch(`${API_URL}/super-admin/stats`);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      // Fetch Settings
      const settingsRes = await fetch(`${API_URL}/super-admin/settings`);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        // Parse settings if they exist, otherwise use defaults
        setSettings({
          maintenanceMode: data.maintenanceMode === 'true',
          allowRegistrations: data.allowRegistrations !== 'false', // default true
          globalAnnouncement: data.globalAnnouncement || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingState({ id, action });
    try {
      const response = await fetch(`${API_URL}/super-admin/cafes/${id}/${action}`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        toast.success(`İşletme başarıyla ${action === 'approve' ? 'onaylandı' : 'reddedildi'}.`);
        fetchData(); // Refresh data to update lists and stats
      } else {
        toast.error('İşlem başarısız oldu.');
      }
    } catch (error) {
      console.error(`Failed to ${action} cafe:`, error);
      toast.error('Bir hata oluştu.');
    } finally {
      setProcessingState(null);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      // Update each setting individually (backend supports key-value update)
      // In a real app, you might want a bulk update endpoint
      await fetch(`${API_URL}/super-admin/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'maintenanceMode', value: String(settings.maintenanceMode) })
      });

      await fetch(`${API_URL}/super-admin/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'allowRegistrations', value: String(settings.allowRegistrations) })
      });

      await fetch(`${API_URL}/super-admin/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'globalAnnouncement', value: settings.globalAnnouncement })
      });

      toast.success('Site ayarları güncellendi.');
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Ayarlar kaydedilirken bir hata oluştu.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/admin/super/login');
  };

  const filteredCafes = cafes.filter(cafe => {
    const matchesSearch = 
      cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cafe.admins[0]?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cafe.admins[0]?.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return cafe.status === 'PENDING';
    if (activeTab === 'active') return cafe.status === 'APPROVED' && cafe.isActive;
    if (activeTab === 'rejected') return cafe.status === 'REJECTED' || !cafe.isActive;
    
    return true;
  });

  const StatCard = ({ title, value, icon: Icon, color, description }: { title: string; value: number; icon: React.ElementType; color: string; description: string }) => (
    <Card className="border-none shadow-md bg-white dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold">{value}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Store className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 hidden md:block">
              Süper Admin Paneli
            </h1>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 md:hidden">
              Admin
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="rounded-full bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                  <Settings className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Ayarlar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Site Ayarları</DialogTitle>
                  <DialogDescription>
                    Sistem genelindeki yapılandırmaları buradan yönetebilirsiniz.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label htmlFor="maintenance" className="flex items-center gap-2">
                        <Power className="h-4 w-4" /> Bakım Modu
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Aktif edildiğinde sadece yöneticiler giriş yapabilir.
                      </p>
                    </div>
                    <Switch
                      id="maintenance"
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label htmlFor="registrations" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Yeni Kayıtlar
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Yeni işletme başvurularını açıp kapatın.
                      </p>
                    </div>
                    <Switch
                      id="registrations"
                      checked={settings.allowRegistrations}
                      onCheckedChange={(checked) => setSettings({ ...settings, allowRegistrations: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="announcement" className="flex items-center gap-2">
                      <BellRing className="h-4 w-4" /> Global Duyuru
                    </Label>
                    <Textarea
                      id="announcement"
                      placeholder="Tüm kullanıcılara görünecek duyuru metni..."
                      value={settings.globalAnnouncement}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({ ...settings, globalAnnouncement: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={saveSettings} disabled={savingSettings}>
                    {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kaydet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              variant="secondary" 
              size="sm" 
              onClick={fetchData} 
              disabled={loading} 
              className="rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
            >
              <RefreshCw className={`h-4 w-4 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Yenile</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full px-2 md:px-4"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Çıkış</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Toplam İşletme"
            value={stats?.totalCafes || 0}
            icon={Store}
            color="bg-blue-500"
            description="Sisteme kayıtlı tüm işletmeler"
          />
          <StatCard
            title="Bekleyen Onay"
            value={stats?.pendingCafes || 0}
            icon={AlertCircle}
            color="bg-yellow-500"
            description="Onay bekleyen başvurular"
          />
          <StatCard
            title="Aktif İşletme"
            value={stats?.activeCafes || 0}
            icon={Activity}
            color="bg-green-500"
            description="Şu an hizmet verenler"
          />
          <StatCard
            title="Toplam Kullanıcı"
            value={stats?.totalUsers || 0}
            icon={Users}
            color="bg-purple-500"
            description="Sistemdeki toplam yönetici"
          />
        </div>

        {/* Main Content */}
        <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>İşletme Yönetimi</CardTitle>
                <CardDescription>Tüm cafe başvurularını ve aktif işletmeleri buradan yönetebilirsiniz.</CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="İşletme veya yetkili ara..."
                  className="pl-9 bg-white dark:bg-slate-950"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger value="pending" className="rounded-lg">Bekleyenler</TabsTrigger>
                <TabsTrigger value="active" className="rounded-lg">Aktif İşletmeler</TabsTrigger>
                <TabsTrigger value="rejected" className="rounded-lg">Reddedilenler</TabsTrigger>
                <TabsTrigger value="rewards" className="rounded-lg flex items-center gap-2"><Gift className="w-4 h-4" /> Hediye Kataloğu</TabsTrigger>
                <TabsTrigger value="all" className="rounded-lg">Tümü</TabsTrigger>
              </TabsList>

              <TabsContent value="rewards" className="mt-0">
                <RewardsManagement cafes={cafes} />
              </TabsContent>

              {activeTab !== 'rewards' && (
                <TabsContent value={activeTab} className="mt-0">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : filteredCafes.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="bg-slate-100 dark:bg-slate-800 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store className="h-10 w-10 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium">Kayıt Bulunamadı</h3>
                      <p className="text-slate-500">Bu kategoride gösterilecek işletme yok.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCafes.map((cafe) => (
                        <motion.div
                          key={cafe.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all bg-white dark:bg-slate-900 group">
                            <div className={`h-2 w-full ${
                              cafe.status === 'APPROVED' ? 'bg-green-500' :
                              cafe.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <CardHeader className="pb-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg font-bold flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                                    {cafe.name}
                                  </CardTitle>
                                  <CardDescription className="flex items-center mt-1 text-xs">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(cafe.createdAt), 'd MMMM yyyy HH:mm', { locale: tr })}
                                  </CardDescription>
                                </div>
                                <Badge variant={
                                  cafe.status === 'APPROVED' ? 'default' :
                                  cafe.status === 'PENDING' ? 'secondary' : 'destructive'
                                } className={
                                  cafe.status === 'APPROVED' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                  cafe.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : ''
                               }>
                                  {cafe.status === 'APPROVED' ? 'Aktif' :
                                  cafe.status === 'PENDING' ? 'Bekliyor' : 'Pasif'}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <div className="flex items-center text-sm">
                                  <User className="h-4 w-4 mr-3 text-indigo-500" />
                                  <span className="font-medium">{cafe.admins[0]?.name || 'Yönetici Yok'}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <Mail className="h-4 w-4 mr-3 text-indigo-500" />
                                  <span className="truncate" title={cafe.admins[0]?.email}>{cafe.admins[0]?.email || '-'}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <Phone className="h-4 w-4 mr-3 text-indigo-500" />
                                  <span>{cafe.phone}</span>
                                </div>
                              </div>

                              <div className="pt-2 flex gap-3">
                                {cafe.status === 'PENDING' ? (
                                  <>
                                    <Button
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                                      onClick={() => handleAction(cafe.id, 'approve')}
                                      disabled={processingState?.id === cafe.id}
                                    >
                                      {processingState?.id === cafe.id && processingState?.action === 'approve' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-4 w-4 mr-2" /> Onayla
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                      onClick={() => handleAction(cafe.id, 'reject')}
                                      disabled={processingState?.id === cafe.id}
                                    >
                                      {processingState?.id === cafe.id && processingState?.action === 'reject' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <XCircle className="h-4 w-4 mr-2" /> Reddet
                                        </>
                                      )}
                                    </Button>
                                  </>
                                ) : cafe.status === 'APPROVED' ? (
                                  <Button
                                    variant="outline"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => handleAction(cafe.id, 'reject')}
                                    disabled={processingState?.id === cafe.id}
                                  >
                                    {processingState?.id === cafe.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <XCircle className="h-4 w-4 mr-2" /> Askıya Al / Pasifleştir
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className="w-full border-green-200 text-green-600 hover:bg-green-50"
                                    onClick={() => handleAction(cafe.id, 'approve')}
                                    disabled={processingState?.id === cafe.id}
                                  >
                                    {processingState?.id === cafe.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Tekrar Aktifleştir
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )} 
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
