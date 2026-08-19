'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, FileText, MapPin, Calendar, Building2, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(`/admin${path}`);

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/events', label: 'Events', icon: Calendar },
    { href: '/admin/facilities', label: 'Facilities', icon: Building2 },
    { href: '/admin/clubs', label: 'Clubs', icon: Users },
    { href: '/admin/contacts', label: 'Contacts', icon: FileText },
    { href: '/admin/locations', label: 'Locations', icon: MapPin },
    { href: '/admin/documents', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold">Campus Admin</h1>
          <p className="text-sm text-slate-400">Management Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/15'
                    : 'text-slate-350 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={20} />
            <span>Back to App</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b border-slate-200">
          <div className="flex items-center justify-between p-6">
            <h2 className="text-3xl font-bold text-slate-900">Admin Dashboard</h2>
            <div className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
