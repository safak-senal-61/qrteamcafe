import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
    } catch {
      toast.error('Raporlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await issueReportsService.update(id, { status: status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' });
      toast.success('Durum güncellendi.');
      fetchReports();
    } catch {
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
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="p-4 flex flex-col md:flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1 w-full md:w-auto">
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusIcon(report.status)}
                <CardTitle className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {report.title}
                </CardTitle>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1">
                <span className="font-medium">{report.cafe?.name}</span>
                <span>•</span>
                <span>{format(new Date(report.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="flex-shrink-0">
                {getPriorityBadge(report.priority)}
              </div>
              <Select
                defaultValue={report.status}
                onValueChange={(value) => handleStatusChange(report.id, value)}
              >
                <SelectTrigger className="w-[120px] md:w-[140px] h-8 text-xs md:text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
          <CardContent className="p-4 pt-0">
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300">{report.description}</p>
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
