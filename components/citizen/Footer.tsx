'use client';

import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.01-.02-1.99-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.42.36.78 1.07.78 2.15 0 1.56-.01 2.81-.01 3.19 0 .31.21.67.8.56C20.21 21.38 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Rankings', href: '/citizen/rankings' },
      { label: 'Compare MPs', href: '/citizen/compare' },
      { label: 'Elections', href: '/citizen/election' },
      { label: 'Search', href: '/citizen/search' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About LokLens', href: '/citizen/about' },
      { label: 'Methodology', href: '/citizen/methodology' },
      { label: 'Parties', href: '/citizen/parties' },
    ],
  },
  {
    title: 'Data Sources',
    links: [
      { label: 'PRS Legislative Research', href: 'https://prsindia.org', external: true },
      { label: 'Sansad (Lok Sabha)', href: 'https://sansad.in', external: true },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2 space-y-4">
            <Link href="/citizen" className="flex items-center gap-2 w-fit">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-black">L</span>
              </div>
              <span className="text-lg font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                LokLens
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Independent, non-partisan tracking of the 18th Lok Sabha — built on public parliamentary records so every citizen can see how their MP performs.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-foreground/5 border border-border/60 flex items-center justify-center hover:border-indigo-500/40 hover:text-indigo-500 transition-colors"
                aria-label="GitHub"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <a
                href="mailto:contact@loklens.in"
                className="w-9 h-9 rounded-xl bg-foreground/5 border border-border/60 flex items-center justify-center hover:border-indigo-500/40 hover:text-indigo-500 transition-colors"
                aria-label="Contact"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map(col => (
            <div key={col.title} className="space-y-3.5">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link.label}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground/70 hover:text-indigo-500 transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-sm font-medium text-foreground/70 hover:text-indigo-500 transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground font-medium text-center md:text-left">
            © {year} LokLens. Independent · Non-Partisan · Built on public parliamentary data.
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            Not affiliated with the Government of India or any political party.
          </p>
        </div>
      </div>
    </footer>
  );
}
