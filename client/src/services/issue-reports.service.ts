import { api } from '@/lib/api';

export interface IssueReport {
  id: string;
  cafeId: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  cafe?: {
    name: string;
  };
}

export interface CreateIssueReportDto {
  title: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface UpdateIssueReportDto {
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const issueReportsService = {
  create: async (data: CreateIssueReportDto) => {
    const response = await api.post('/issue-reports', data);
    return response.data;
  },

  findAll: async () => {
    const response = await api.get<IssueReport[]>('/issue-reports');
    return response.data;
  },

  update: async (id: string, data: UpdateIssueReportDto) => {
    const response = await api.patch<IssueReport>(`/issue-reports/${id}`, data);
    return response.data;
  },
};
