import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { issueReportsService } from '@/services/issue-reports.service';
import { MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

export function ReportIssueDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await issueReportsService.create(formData);
      toast.success('Sorun bildirimi başarıyla gönderildi.');
      setOpen(false);
      setFormData({ title: '', description: '', priority: 'MEDIUM' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Issue report submission error:', error);
      const errorMessage = error.response?.data?.message || 'Bildirim gönderilirken bir hata oluştu.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 border-dashed">
          <MessageSquarePlus className="h-4 w-4" />
          Sorun Bildir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sorun Bildir</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Konu</Label>
            <Input
              required
              placeholder="Örn: Menü güncelleme hatası"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Öncelik</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Düşük</SelectItem>
                <SelectItem value="MEDIUM">Orta</SelectItem>
                <SelectItem value="HIGH">Yüksek</SelectItem>
                <SelectItem value="CRITICAL">Kritik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea
              required
              placeholder="Sorunu detaylı bir şekilde açıklayınız..."
              className="min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Gönderiliyor...' : 'Gönder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
