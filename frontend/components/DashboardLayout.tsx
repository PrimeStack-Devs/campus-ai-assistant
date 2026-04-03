'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
}

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar title={title} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
