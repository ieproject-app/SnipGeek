
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Direct access to dashboard now redirects to posts management
  redirect('/admin/posts');
}
