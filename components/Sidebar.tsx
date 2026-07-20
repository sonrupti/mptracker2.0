'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BarChart2,
  GitCompare, 
  Trophy, 
  Search, 
  TrendingUp, 
  MapPin,
  ChevronRight,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db, MP } from '@/lib/supabase';
import GoogleTranslate from '@/components/GoogleTranslate';
import { useLanguage, Language } from "@/context/LanguageContext";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MP[]>([]);
  const [allMps, setAllMps] = useState<MP[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
const { t } = useLanguage();
  // Load all MPs for quick search filtering
  useEffect(() => {
    async function loadMps() {
      const data = await db.getMps();
      setAllMps(data);
    }
    loadMps();
  }, []);

  // Filter MPs based on search input
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const filtered = allMps.filter(mp => 
      mp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mp.constituency.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5); // limit to 5 results
    setSearchResults(filtered);
  }, [searchQuery, allMps]);

 const navItems = [
  { name: t.home, href: "/", icon: LayoutDashboard },
  { name: t.listing, href: "/mps", icon: Users },
  { name: t.rankings, href: "/rankings", icon: Trophy },
  { name: t.parties, href: "/parties", icon: BarChart2 },
  { name: t.methodology, href: "/methodology", icon: FileText },
  { name: t.dashboard, href: "/dashboard", icon: MapPin },
  { name: t.election, href: "/election", icon: Users },
];
  const handleSelectMp = (mpId: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsMobileOpen(false);
    router.push(`/mps/${mpId}`);
  };

  const getPartyColor = (party: string) => {
    switch (party) {
      case 'Labour': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Conservative': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'SNP': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Liberal Democrat': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Green': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-zinc-500/20 text-muted-foreground border-zinc-500/30';
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground focus:outline-none"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

  <aside
  className={cn(
    `fixed lg:static inset-y-0 left-0 z-45 w-64
     bg-background
     border-r border-border
     text-foreground
     flex flex-col h-full
     transition-transform duration-300
     transform lg:transform-none`,
    isMobileOpen
      ? "translate-x-0"
      : "-translate-x-full lg:translate-x-0",
    className
  )}
>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-900 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-tr from-indigo-700 to-violet-500" />
            <TrendingUp className="h-4.5 w-4.5 text-white relative z-10" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
           MP Tracker
          </span>
        </div>

{/* Language Selector */}
<div className="px-4 py-4 border-b border-border">
  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
    Language
  </p>

  <GoogleTranslate />
</div>


        {/* Global Search */}
        <div className="p-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Quick MP Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Quick Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-14 mt-1 bg-background border border-border rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-md">
              <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 border-b border-border bg-background/50">
                MPs Found
              </div>
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map(mp => (
                  <button
                    key={mp.id}
                    onClick={() => handleSelectMp(mp.id)}
                    className="w-full text-left px-3 py-2.5 hover:bg-zinc-850/80 border-b border-border/30 last:border-b-0 flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
                      <img src={mp.image_url} alt={mp.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-popover-foreground group-hover:text-indigo-400 transition-colors truncate">
                        {mp.name}
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5 truncate">
                        <span>{mp.constituency}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-muted-foreground"
                )} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area */}
       <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
              MP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Parliament Session</p>
              <p className="text-[10px] text-muted-foreground truncate">Data Feed: Live Mocks</p>
            </div>
          </div>
        </div>
      </aside>
      
    </>
  );
}
