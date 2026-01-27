import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { issueReportsService, IssueReport } from '@/services/issue-reports.service';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export function IssueReportsList() {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await issueReportsService.findAll();
      setReports(data);
    } catch (error) {
      toast.error('Raporlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await issueReportsService.update(id, { status: status as any });
      toast.success('Durum güncellendi.');
      fetchReports();
    } catch (error) {
      toast.error('Durum güncellenemedi.');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW': return <Badge variant="outline" className="bg-slate-100 text-slate-700">Düşük</Badge>;
      case 'MEDIUM': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Orta</Badge>;
      case 'HIGH': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Yüksek</Badge>;
      case 'CRITICAL': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Kritik</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'RESOLVED': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'CLOSED': return <XCircle className="h-4 w-4 text-slate-500" />;
      default: return null;
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-100">
                {getStatusIcon(report.status)}
                {report.title}
              </CardTitle>
              <div className="text-sm text-slate-400">
                {report.cafe?.name} • {format(new Date(report.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getPriorityBadge(report.priority)}
              <Select
                defaultValue={report.status}
                onValueChange={(value) => handleStatusChange(report.id, value)}
              >
                <SelectTrigger className="w-[140px] h-8 bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Açık</SelectItem>
                  <SelectItem value="IN_PROGRESS">İşlemde</SelectItem>
                  <SelectItem value="RESOLVED">Çözüldü</SelectItem>
                  <SelectItem value="CLOSED">Kapalı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">{report.description}</p>
          </CardContent>
        </Card>
      ))}
      {reports.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          Henüz bildirim bulunmuyor.
        </div>
      )}
    </div>
  );
}
