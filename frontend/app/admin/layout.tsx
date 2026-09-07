import { AdminAuthProvider } from '@/context/AdminAuthContext';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
