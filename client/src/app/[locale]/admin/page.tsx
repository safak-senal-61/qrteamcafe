import { redirect } from '@/navigation';

export default function AdminPage() {
  redirect({ href: '/admin/dashboard', locale: 'tr' });
}
