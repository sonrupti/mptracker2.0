'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'mr', label: 'Marathi' },
  { code: 'or', label: 'Odia' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
];

function getCurrentLangCode(): string {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
  return match ? match[1] : 'en';
}

function setLanguage(code: string) {
  const hostname = window.location.hostname;

  if (code === 'en') {
    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    document.cookie = `googtrans=; path=/; domain=${hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
  } else {
    const value = `/en/${code}`;
    document.cookie = `googtrans=${value}; path=/`;
    document.cookie = `googtrans=${value}; path=/; domain=${hostname}`;
  }

  window.location.reload();
}

interface LanguageSwitcherProps {
  /** 'down' opens below the trigger (desktop navbar), 'up' opens above it (mobile bottom nav) */
  direction?: 'down' | 'up';
  /** compact icon-only trigger for the mobile bottom bar */
  compact?: boolean;
}

export default function LanguageSwitcher({
  direction = 'down',
  compact = false,
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('en');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(getCurrentLangCode());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel =
    current === 'en'
      ? 'English'
      : LANGUAGES.find((l) => l.code === current)?.label ?? 'English';

  return (
    <div ref={ref} className="relative notranslate">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg font-semibold text-muted-foreground hover:text-foreground transition',
          compact
            ? 'flex-col justify-center text-[9px] uppercase gap-1'
            : 'px-3 py-1.5 text-xs border border-border'
        )}
      >
        <Globe className={cn(compact ? 'h-5 w-5' : 'h-3.5 w-3.5')} />
        {compact ? 'Lang' : currentLabel}
        {!compact && (
          <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 z-[60] w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-2',
            direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'
          )}
        >
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              'w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-accent',
              current === 'en' && 'text-indigo-500'
            )}
          >
            English
          </button>

          <div className="grid grid-cols-2 gap-x-1 mt-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  'text-left px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-accent truncate',
                  current === lang.code && 'text-indigo-500'
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}