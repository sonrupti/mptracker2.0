'use client';

import { useLanguage } from '@/context/LanguageContext';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { PARTY_SYMBOLS } from "@/lib/partysymbols";

import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  FileText, 
  MessageSquare, 
  ChevronRight,
  TrendingDown,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { cn } from '@/lib/utils';
;

export default function MpListingPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [mps, setMps] = useState<MP[]>([]);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [party, setParty] = useState('All');
  const [region, setRegion] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'overall_score' | 'attendance_rate' | 'questions_count' | 'bills_sponsored'>('overall_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Unique Lists for Select inputs
  const [parties, setParties] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    // Fetch unique parties and regions for dropdowns
    async function loadFilterOptions() {
      const allData = await db.getMps();
      const uniqueParties = Array.from(new Set(allData.map(m => m.party)));
      const uniqueRegions = Array.from(new Set(allData.map(m => m.region)));
      setParties(uniqueParties);
      setRegions(uniqueRegions);
    }
    loadFilterOptions();
  }, []);

  useEffect(() => {
    async function fetchFilteredMps() {
      setLoading(true);
      try {
        const data = await db.getMps({
          search,
          party,
          region,
          status,
          sortBy,
          sortOrder
        });
        setMps(data);
      } catch (error) {
        console.error('Error fetching MPs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFilteredMps();
  }, [search, party, region, status, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearch('');
    setParty('All');
    setRegion('All');
    setStatus('All');
    setSortBy('overall_score');
    setSortOrder('desc');
  };

  const getPartyBg = (partyName: string) => {
    switch (partyName) {
      case 'Labour': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'Conservative': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'SNP': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'Liberal Democrat': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'Green': return 'bg-green-500/10 border-green-500/20 text-green-400';
      default: return 'bg-card-500/10 border-zinc-500/20 text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.memberDir}</h1>
        <p className="text-muted-foreground text-sm">
          Browse, filter, and compare the activity levels and scores of all sitting and former Members of Parliament.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border p-5 rounded-xl space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
            <span>{t.searchFilters}</span>
          </div>
          <button 
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-indigo-400 font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.searchNameSeat}</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Starmer, Richmond..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-lg py-2 pl-9 pr-4 text-xs text-foreground tplaceholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Party */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Party</label>
            <select
              value={party}
              onChange={(e) => setParty(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-indigo-500/50"
            >
              <option value="All">{t.allParties}</option>
              {parties.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-indigo-500/50"
            >
              <option value="All">{t.allRegions}</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.officeStatus}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-indigo-500/50"
            >
              <option value="All">{t.allStatuses}</option>
              <option value="Active">{t.activeMps}</option>
              <option value="Inactive">{t.formerMps}</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.sortMetric}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-background border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-indigo-500/50"
            >
              <option value="overall_score">{t.overallScore}</option>
              <option value="attendance_rate">{t.attendanceRate}</option>
              <option value="questions_count">{t.totalQuestions}</option>
              <option value="bills_sponsored">{t.billsSponsored}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
          <span className="mt-3 text-xs text-muted-foreground">{t.filteringDb}</span>
        </div>
      ) : mps.length > 0 ? (
        /* MP Directory Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mps.map(mp => (
            <div 
              key={mp.id} 
              className="glow-card group bg-card border border-border rounded-xl overflow-hidden flex flex-col justify-between"
            >
              {/* Top Section */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  {/* Photo & Name */}
                  <div className="flex gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-border shrink-0">
                      <img src={mp.image_url} alt={mp.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground group-hover:text-indigo-400 transition-colors truncate">
                        {mp.name}
                      </h3>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{mp.constituency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Circle */}
                  <div className="text-center shrink-0">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{t.score}</span>
                    <div className="mt-0.5 px-2.5 py-1 bg-background border border-border rounded-lg text-sm font-bold text-indigo-400 group-hover:border-indigo-500/35 transition-all">
                      {mp.overall_score}
                    </div>
                  </div>
                </div>

                {/* Party & Office Status Badges */}
              <div
  className={cn(
    "flex items-center gap-1 text-[9px] px-2 py-1 rounded border font-semibold",
    getPartyBg(mp.party)
  )}
>
  <div className="w-5 h-5 rounded-full bg-white ring-1 ring-border flex items-center justify-center shrink-0 overflow-hidden">
    <Image
      src={PARTY_SYMBOLS[mp.party] || PARTY_SYMBOLS["Independent"]}
      alt={mp.party}
      width={16}
      height={16}
      className="object-contain"
    />
  </div>
  <span className="truncate">{mp.party}</span>
</div>

                {/* Substats Panel */}
                <div className="grid grid-cols-3 gap-2 bg-background/40 p-3 rounded-lg border border-border/60">
                  <div className="text-center">
                    <span className="text-[9px] text-muted-foreground block uppercase font-medium">Attendance</span>
                    <span className="text-xs font-bold text-foreground">{mp.attendance_rate}%</span>
                  </div>
                  <div className="text-center border-x border-border/80">
                    <span className="text-[9px] text-muted-foreground block uppercase font-medium">Questions</span>
                    <span className="text-xs font-bold text-foreground">{mp.questions_count}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] text-muted-foreground block uppercase font-medium">{t.billsSp}</span>
                    <span className="text-xs font-bold text-foreground">{mp.bills_sponsored}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link 
                href={`/mps/${mp.id}`}
                className="w-full py-3 bg-background/40 border-t border-border text-center text-xs font-bold text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <span>{t.accessProfile}</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 border border-dashed border-border rounded-xl text-center space-y-3">
          <p className="text-sm text-muted-foreground font-medium">{t.noMpsFoundMatching}</p>
          <button 
            onClick={clearFilters}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white transition-colors"
          >
            Clear Search Filters
          </button>
        </div>
      )}
    </div>
  );
}
