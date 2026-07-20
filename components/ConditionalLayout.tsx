'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/theme-toggle';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullPage = pathname === '/login' || pathname === '/dashboard' || pathname.startsWith('/citizen');

  return (
    <>
      {!isFullPage && <Sidebar />}
      {!isFullPage && <ThemeToggle />}
      <main className={isFullPage
        ? "flex-1 min-w-0 min-h-screen flex flex-col"
        : "flex-1 min-w-0 min-h-screen flex flex-col overflow-y-auto px-4 py-8 md:px-8 lg:px-12 pt-20 lg:pt-8"
      }>
        {children}
      </main>
    </>
  );
}