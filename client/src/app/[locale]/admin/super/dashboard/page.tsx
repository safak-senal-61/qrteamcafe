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
  Settings,
  Power,
  Globe,
  Gift,
  Megaphone,
  CreditCard,
  Trash2
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_URL } from '@/lib/api';
import { RewardsManagement } from '@/components/admin/RewardsManagement';
import { IssueReportsList } from '@/components/admin/IssueReportsList';

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
  plan: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  isSubscriptionActive: boolean;
}

interface DashboardStats {
  totalCafes: number;
  pendingCafes: number;
  activeCafes: number;
  rejectedCafes: number;
  totalUsers: number;
  totalOrders: number;
}

interface FinancialStats {
  trialCafes: number;
  proCafes: number;
  enterpriseCafes: number;
  activeSubscriptions: number;
  expiringCafes: {
    id: string;
    name: string;
    subscriptionEndsAt: string;
    plan: string;
  }[];
}

interface RecentLog {
  id: string;
  actionType: string;
  details: string;
  timestamp: string;
  cafe: { name: string };
  waiter?: { firstName: string; lastName: string };
  admin?: { name: string };
}

interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistrations: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER';
  isActive: boolean;
  targetRole: 'ALL' | 'CAFE_ADMIN' | 'WAITER';
  expiresAt: string | null;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    allowRegistrations: true,
  });
  const [loading, setLoading] = useState(true);
  // Change processingId to store both ID and Action
  const [processingState, setProcessingState] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Subscription Extension State
  const [subscriptionDialog, setSubscriptionDialog] = useState<{ open: boolean; cafeId: string; cafeName: string } | null>(null);
  const [extensionMonths, setExtensionMonths] = useState(1);
  const [extendingSubscription, setExtendingSubscription] = useState(false);

  // Announcement State
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState<{
    title: string;
    content: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER';
    targetRole: 'ALL' | 'CAFE_ADMIN' | 'WAITER';
    expiresInDays: number;
  }>({
    title: '',
    content: '',
    type: 'INFO',
    targetRole: 'ALL',
    expiresInDays: 7
  });
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
        setLoading(false);
        return;
    }

    try {
      // Fetch Cafes
      const cafesRes = await fetch(`${API_URL}/super-admin/cafes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (cafesRes.ok) {
        const data = await cafesRes.json();
        setCafes(data);
      }

      // Fetch Stats
      const statsRes = await fetch(`${API_URL}/super-admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      // Fetch Financial Stats
      const financialRes = await fetch(`${API_URL}/super-admin/financial-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (financialRes.ok) {
        const data = await financialRes.json();
        setFinancialStats(data);
      }

      // Fetch Recent Logs
      const logsRes = await fetch(`${API_URL}/super-admin/recent-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const data = await logsRes.json();
        setRecentLogs(data);
      }

      // Fetch Announcements
      const announcementsRes = await fetch(`${API_URL}/announcements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (announcementsRes.ok) {
        const data = await announcementsRes.json();
        setAnnouncements(data);
      }

      // Fetch Settings
      const settingsRes = await fetch(`${API_URL}/super-admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        // Parse settings if they exist, otherwise use defaults
        setSettings({
          maintenanceMode: data.maintenanceMode === 'true',
          allowRegistrations: data.allowRegistrations !== 'false', // default true
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

      toast.success('Site ayarları güncellendi.');
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Ayarlar kaydedilirken bir hata oluştu.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    setCreatingAnnouncement(true);
    const token = localStorage.getItem('token');
    if (!token) {
        setCreatingAnnouncement(false);
        return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + newAnnouncement.expiresInDays);

      const response = await fetch(`${API_URL}/announcements`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          type: newAnnouncement.type,
          targetRole: newAnnouncement.targetRole,
          expiresAt: expiresAt.toISOString(),
          isActive: true
        }),
      });

      if (response.ok) {
        toast.success('Duyuru başarıyla oluşturuldu.');
        setIsAnnouncementOpen(false);
        setNewAnnouncement({
          title: '',
          content: '',
          type: 'INFO',
          targetRole: 'ALL',
          expiresInDays: 7
        });
        fetchData();
      } else {
        toast.error('Duyuru oluşturulurken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
      toast.error('Bir hata oluştu.');
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Duyuru silindi.');
        fetchData();
      } else {
        toast.error('Silme işlemi başarısız.');
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      toast.error('Bir hata oluştu.');
    }
  };

  const handleExtendSubscription = async () => {
    if (!subscriptionDialog) return;

    setExtendingSubscription(true);
    const token = localStorage.getItem('token');
    if (!token) {
        setExtendingSubscription(false);
        return;
    }

    try {
      const response = await fetch(`${API_URL}/super-admin/cafes/${subscriptionDialog.cafeId}/subscription`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ months: extensionMonths }),
      });

      if (response.ok) {
        toast.success(`${subscriptionDialog.cafeName} için abonelik ${extensionMonths} ay uzatıldı.`);
        setSubscriptionDialog(null);
        fetchData();
      } else {
        toast.error('Abonelik uzatılırken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Failed to extend subscription:', error);
      toast.error('Bir hata oluştu.');
    } finally {
      setExtendingSubscription(false);
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
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-1.5 md:p-2 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`h-3 w-3 md:h-4 md:w-4 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-xl md:text-2xl font-bold">{value}</h3>
          <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">{description}</p>
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
            <div className="bg-indigo-600 p-1.5 md:p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Store className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              <span className="hidden md:block">Süper Admin Paneli</span>
              <span className="md:hidden">Admin</span>
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
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={saveSettings} disabled={savingSettings}>
                    {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kaydet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30">
                  <Megaphone className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Duyuru Ekle</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Yeni Duyuru</DialogTitle>
                  <DialogDescription>
                    Tüm kullanıcılara gösterilecek bir duyuru oluşturun.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Başlık</Label>
                    <Input 
                      value={newAnnouncement.title} 
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                      placeholder="Duyuru başlığı..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>İçerik</Label>
                    <Textarea 
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                      placeholder="Duyuru içeriği..." 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tür</Label>
                      <Select 
                        value={newAnnouncement.type} 
                        onValueChange={(v) => setNewAnnouncement({...newAnnouncement, type: v as 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INFO">Bilgi</SelectItem>
                          <SelectItem value="WARNING">Uyarı</SelectItem>
                          <SelectItem value="SUCCESS">Başarılı</SelectItem>
                          <SelectItem value="DANGER">Kritik</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hedef Kitle</Label>
                      <Select 
                        value={newAnnouncement.targetRole} 
                        onValueChange={(v) => setNewAnnouncement({...newAnnouncement, targetRole: v as 'ALL' | 'CAFE_ADMIN' | 'WAITER'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Herkes</SelectItem>
                          <SelectItem value="CAFE_ADMIN">Kafe Yöneticileri</SelectItem>
                          <SelectItem value="WAITER">Garsonlar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Süre (Gün)</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={newAnnouncement.expiresInDays}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, expiresInDays: parseInt(e.target.value) || 7})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateAnnouncement} disabled={creatingAnnouncement}>
                    {creatingAnnouncement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Oluştur
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              variant="secondary" 
              size="sm" 
              onClick={fetchData} 
              disabled={loading} 
              className="rounded-full bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
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

      <main className="container mx-auto px-2 md:px-4 py-4 md:py-8 space-y-4 md:space-y-8">
        {/* Active Announcements */}
        {announcements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-600" />
              Aktif Duyurular
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {announcements.map((ann) => (
                <Card key={ann.id} className="border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={
                            ann.type === 'INFO' ? 'secondary' : 
                            ann.type === 'WARNING' ? 'outline' : 
                            ann.type === 'DANGER' ? 'destructive' : 'default'
                          } className="text-[10px] px-1.5 py-0">
                            {ann.type}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {ann.targetRole === 'ALL' ? 'Tümü' : ann.targetRole === 'CAFE_ADMIN' ? 'Yöneticiler' : 'Garsonlar'}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm">{ann.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Bitiş: {ann.expiresAt ? format(new Date(ann.expiresAt), 'd MMM yyyy', { locale: tr }) : 'Süresiz'}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteAnnouncement(ann.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Toplam İşletme"
            value={stats?.totalCafes || 0}
            icon={Store}
            color="bg-blue-500"
            description="Sistemdeki kayıtlı tüm işletmeler"
          />
          <StatCard
            title="Aktif Abonelik"
            value={financialStats?.activeSubscriptions || 0}
            icon={CreditCard}
            color="bg-green-500"
            description="Ödeme yapan aktif müşteriler"
          />
          <StatCard
            title="Onay Bekleyen"
            value={stats?.pendingCafes || 0}
            icon={AlertCircle}
            color="bg-amber-500"
            description="İncelenmesi gereken başvurular"
          />
          <StatCard
            title="Toplam Sipariş"
            value={stats?.totalOrders || 0}
            icon={CreditCard}
            color="bg-purple-500"
            description="Platform geneli toplam sipariş"
          />
        </div>

        {/* Financial & Logs Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Financial Overview */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-indigo-500" />
                Paket Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/20 dark:text-blue-400">
                      <Gift className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Trial</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold">{financialStats?.trialCafes || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-full dark:bg-purple-900/20 dark:text-purple-400">
                      <Store className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Pro</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold">{financialStats?.proCafes || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Enterprise</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold">{financialStats?.enterpriseCafes || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Subscriptions */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-orange-500" />
                Aboneliği Bitenler (7 Gün)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!financialStats?.expiringCafes?.length ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    Yaklaşan bitiş yok.
                  </div>
                ) : (
                  financialStats.expiringCafes.map((cafe) => (
                    <div key={cafe.id} className="flex items-center justify-between p-2 border rounded-md bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{cafe.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{cafe.plan} Plan</span>
                      </div>
                      <Badge variant="outline" className="text-xs bg-white dark:bg-slate-950">
                        {new Date(cafe.subscriptionEndsAt).toLocaleDateString('tr-TR')}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Logs */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5 text-rose-500" />
                Son Aktiviteler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    Henüz kayıtlı bir olay yok.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
                        <AlertCircle className="h-3 w-3 text-rose-500 mt-1 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium">{log.actionType}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(log.timestamp).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{log.details}</p>
                          <div className="flex items-center gap-1">
                             <Badge variant="secondary" className="text-[9px] h-4 px-1">{log.cafe.name}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="p-4 md:pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg md:text-2xl">İşletme Yönetimi</CardTitle>
                <CardDescription className="text-xs md:text-sm">Tüm cafe başvurularını ve aktif işletmeleri buradan yönetebilirsiniz.</CardDescription>
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
          <CardContent className="p-2 md:p-6">
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
              <div className="overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-max md:w-auto flex">
                  <TabsTrigger value="pending" className="rounded-lg text-xs md:text-sm">Bekleyenler</TabsTrigger>
                  <TabsTrigger value="active" className="rounded-lg text-xs md:text-sm">Aktif İşletmeler</TabsTrigger>
                  <TabsTrigger value="rejected" className="rounded-lg flex items-center gap-2 text-xs md:text-sm">
                    <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                    Reddedilenler ({stats?.rejectedCafes || 0})
                  </TabsTrigger>
                  <TabsTrigger value="issues" className="rounded-lg flex items-center gap-2 text-xs md:text-sm">
                    <AlertCircle className="h-3 w-3 md:h-4 md:w-4" />
                    Bildirimler
                  </TabsTrigger>
                  <TabsTrigger value="rewards" className="rounded-lg flex items-center gap-2 text-xs md:text-sm"><Gift className="w-3 h-3 md:w-4 md:h-4" /> Hediye Kataloğu</TabsTrigger>
                  <TabsTrigger value="all" className="rounded-lg text-xs md:text-sm">Tümü</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="rewards" className="mt-0">
                <RewardsManagement cafes={cafes} />
              </TabsContent>

              <TabsContent value="issues" className="mt-0">
                <IssueReportsList />
              </TabsContent>

              {activeTab !== 'rewards' && activeTab !== 'issues' && (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {filteredCafes.map((cafe) => (
                        <motion.div
                          key={cafe.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all bg-white dark:bg-slate-900 group">
                            <div className={`h-1.5 md:h-2 w-full ${
                              cafe.status === 'APPROVED' ? 'bg-green-500' :
                              cafe.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2 group-hover:text-indigo-600 transition-colors truncate">
                                    {cafe.name}
                                  </CardTitle>
                                  <CardDescription className="flex items-center text-xs mt-1">
                                    <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                                    {format(new Date(cafe.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
                                  </CardDescription>
                                </div>
                                <Badge variant={
                                  cafe.status === 'APPROVED' ? 'default' :
                                  cafe.status === 'PENDING' ? 'secondary' : 'destructive'
                                } className={`flex-shrink-0 text-[10px] md:text-xs px-2 py-0.5 ${
                                  cafe.status === 'APPROVED' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                  cafe.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : ''
                                }`}>
                                  {cafe.status === 'APPROVED' ? 'Aktif' :
                                  cafe.status === 'PENDING' ? 'Bekliyor' : 'Pasif'}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6 pt-2 md:pt-4 space-y-3 md:space-y-4">
                              <div className="space-y-2 md:space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-lg">
                                <div className="flex items-center text-xs md:text-sm">
                                  <User className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 md:mr-3 text-indigo-500 flex-shrink-0" />
                                  <span className="font-medium truncate">{cafe.admins[0]?.name || 'Yönetici Yok'}</span>
                                </div>
                                <div className="flex items-center text-xs md:text-sm">
                                  <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 md:mr-3 text-indigo-500 flex-shrink-0" />
                                  <span className="truncate" title={cafe.admins[0]?.email}>{cafe.admins[0]?.email || '-'}</span>
                                </div>
                                <div className="flex items-center text-xs md:text-sm">
                                  <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 md:mr-3 text-indigo-500 flex-shrink-0" />
                                  <span>{cafe.phone}</span>
                                </div>
                                
                                {/* Subscription Status */}
                                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400">Abonelik Durumu</span>
                                    <Badge variant="outline" className={`text-[10px] md:text-xs px-1.5 py-0 ${
                                      cafe.isSubscriptionActive ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                                    }`}>
                                      {cafe.isSubscriptionActive ? 'Pro Paket' : 'Deneme Sürümü'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center text-[10px] md:text-xs text-slate-500">
                                    <Calendar className="h-3 w-3 mr-2" />
                                    <span>
                                      Bitiş: {
                                        cafe.isSubscriptionActive && cafe.subscriptionEndsAt 
                                          ? format(new Date(cafe.subscriptionEndsAt), 'd MMM yyyy', { locale: tr })
                                          : cafe.trialEndsAt 
                                            ? format(new Date(cafe.trialEndsAt), 'd MMM yyyy', { locale: tr }) 
                                            : '-'
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 flex flex-col gap-2">
                                <div className="flex gap-2 md:gap-3">
                                {cafe.status === 'PENDING' ? (
                                  <>
                                    <Button
                                      size="sm"
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 text-xs md:text-sm h-8 md:h-9"
                                      onClick={() => handleAction(cafe.id, 'approve')}
                                      disabled={processingState?.id === cafe.id}
                                    >
                                      {processingState?.id === cafe.id && processingState?.action === 'approve' ? (
                                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Onayla
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs md:text-sm h-8 md:h-9"
                                      onClick={() => handleAction(cafe.id, 'reject')}
                                      disabled={processingState?.id === cafe.id}
                                    >
                                      {processingState?.id === cafe.id && processingState?.action === 'reject' ? (
                                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <XCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Reddet
                                        </>
                                      )}
                                    </Button>
                                  </>
                                ) : cafe.status === 'APPROVED' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs md:text-sm h-8 md:h-9"
                                    onClick={() => handleAction(cafe.id, 'reject')}
                                    disabled={processingState?.id === cafe.id}
                                  >
                                    {processingState?.id === cafe.id ? (
                                      <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <XCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Askıya Al
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-green-200 text-green-600 hover:bg-green-50 text-xs md:text-sm h-8 md:h-9"
                                    onClick={() => handleAction(cafe.id, 'approve')}
                                    disabled={processingState?.id === cafe.id}
                                  >
                                    {processingState?.id === cafe.id ? (
                                      <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Tekrar Aktifleştir
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                              {cafe.status === 'APPROVED' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs md:text-sm h-8 md:h-9"
                                  onClick={() => setSubscriptionDialog({ open: true, cafeId: cafe.id, cafeName: cafe.name })}
                                >
                                  <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Süre Ekle
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

        {/* Subscription Extension Dialog */}
        <Dialog open={!!subscriptionDialog} onOpenChange={(open) => !open && setSubscriptionDialog(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Abonelik Uzat</DialogTitle>
              <DialogDescription>
                {subscriptionDialog?.cafeName} için abonelik süresi ekleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="months" className="text-right">
                  Ay Sayısı
                </Label>
                <Input
                  id="months"
                  type="number"
                  min="1"
                  value={extensionMonths}
                  onChange={(e) => setExtensionMonths(parseInt(e.target.value) || 1)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleExtendSubscription} disabled={extendingSubscription}>
                {extendingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Süre Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
