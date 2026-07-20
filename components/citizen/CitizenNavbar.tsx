'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, ArrowRightLeft, Search, Info, Vote, Landmark, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/theme-toggle';

const NAV_ITEMS = [
  { name: 'Home', href: '/citizen', icon: Home },
  { name: 'Rankings', href: '/citizen/rankings', icon: TrendingUp },
  { name: 'Parties', href: '/citizen/parties', icon: Landmark },
  { name: 'Compare', href: '/citizen/compare', icon: ArrowRightLeft },
  { name: 'Election', href: '/citizen/election', icon: Vote },
  { name: 'Search', href: '/citizen/search', icon: Search },
];

export default function CitizenNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) =>
    href === '/citizen' ? pathname === '/citizen' : pathname.startsWith(href);

  return (
    <>
      {/* Top navigation bar */}
      <nav
        className={cn(
          'sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300',
          scrolled ? 'border-border/60 shadow-sm shadow-black/[0.03]' : 'border-transparent'
        )}
      >
        <div
          className={cn(
            'max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 transition-all duration-300',
            scrolled ? 'h-14' : 'h-16'
          )}
        >
          {/* Logo */}
          <Link href="/citizen" className="flex items-center gap-2 shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white text-xs font-black">L</span>
            </div>
            <span className="text-lg font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              LokLens
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 relative">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200',
                    active ? 'text-indigo-500' : 'text-foreground/60 hover:text-foreground'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-indigo-500/10 rounded-xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  {!active && (
                    <span className="absolute inset-0 rounded-xl bg-foreground/5 opacity-0 hover:opacity-100 transition-opacity" />
                  )}
                  <item.icon className="h-4 w-4 relative" />
                  <span className="relative">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            <Link
              href="/citizen/methodology"
              className={cn(
                'hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                pathname.startsWith('/citizen/methodology')
                  ? 'text-indigo-500'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BarChart2 className="h-4 w-4" />
              Methodology
            </Link>
            <Link
              href="/citizen/about"
              className={cn(
                'hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                pathname.startsWith('/citizen/about')
                  ? 'text-indigo-500'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Info className="h-4 w-4" />
              About
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl safe-area-pb">
        <div className="grid grid-cols-6 h-16">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-colors',
                  active ? 'text-indigo-500' : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5 transition-transform', active && 'scale-110')} />
                <span className="text-[9px] font-bold tracking-wide uppercase">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
