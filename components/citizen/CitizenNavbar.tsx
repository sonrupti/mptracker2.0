'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '@/components/citizen/LanguageSwitcher';

import {
  Home,
  TrendingUp,
  ArrowRightLeft,
  Search,
  Info,
  Vote,
  Landmark,
  BarChart2,
  ListFilter
} from 'lucide-react';

import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/theme-toggle';
import GoogleTranslate from '@/components/GoogleTranslate';


const NAV_ITEMS = [
  { name: 'Home', href: '/citizen/simple', icon: Home },
  { name: 'Activity', href: '/citizen/activity', icon: ListFilter },
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

    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    handleScroll();

    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    );

    return () =>
      window.removeEventListener(
        'scroll',
        handleScroll
      );

  }, []);



  const isActive = (href: string) =>
    href === '/citizen/simple'
      ? pathname === '/citizen/simple'
      : pathname.startsWith(href);



  return (
    <>
    {/* Hidden Google Translate engine — never shown, drives translation via cookie */}
    <div
      aria-hidden
      style={{ position: 'absolute', top: -9999, left: -9999, height: 0, width: 0, overflow: 'hidden' }}
    >
      <GoogleTranslate id="google_translate_element_hidden" />
    </div>

   

      {/* Desktop + Tablet Navbar */}
      <nav
        className={cn(
          'sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl transition-all duration-300',
          scrolled
            ? 'border-border/60 shadow-sm'
            : 'border-transparent'
        )}
      >

        <div
          className={cn(
            'max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8',
            scrolled ? 'h-14' : 'h-16'
          )}
        >


          {/* Logo */}
          <Link
            href="/citizen/simple"
            className="flex items-center gap-2 shrink-0"
          >

            <div className="
              w-7 h-7 rounded-lg
              bg-gradient-to-br from-orange-500 to-green-700
              flex items-center justify-center
            ">
              <span className="text-white text-xs font-black">
                L
              </span>
            </div>


            <span className="
              text-lg font-black
              bg-gradient-to-r from-orange-500 to-green-600
              bg-clip-text text-transparent
            ">
              LokLens
            </span>


          </Link>




          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">

            {
              NAV_ITEMS.map((item)=>{

                const active = isActive(item.href);

                return (

                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition',
                      active
                        ? 'text-orange-500'
                        : 'text-foreground/60 hover:text-foreground'
                    )}
                  >

                    {
                      active && (

                        <motion.span
                          layoutId="nav-pill"
                          className="
                            absolute inset-0
                            rounded-xl
                            bg-orange-500/10
                          "
                        />

                      )
                    }


                    <item.icon className="h-4 w-4 relative" />

                    <span className="relative">
                      {item.name}
                    </span>


                  </Link>

                );

              })
            }

          </div>





          {/* Right Actions */}
          <div className="flex items-center gap-2">


         {/* Desktop Language */}
<div className="hidden md:block relative shrink-0">
  <LanguageSwitcher />
</div>


            <Link
              href="/citizen/methodology"
              className="
                hidden md:flex items-center gap-1.5
                px-3 py-1.5 rounded-lg
                text-xs font-semibold
                text-muted-foreground
                hover:text-foreground
              "
            >

              <BarChart2 className="h-4 w-4" />

              Methodology

            </Link>




            <Link
              href="/citizen/about"
              className="
                hidden md:flex items-center gap-1.5
                px-3 py-1.5 rounded-lg
                text-xs font-semibold
                text-muted-foreground
                hover:text-foreground
              "
            >

              <Info className="h-4 w-4" />

              About

            </Link>




            <ThemeToggle />


          </div>



        </div>

      </nav>
     


          {/* Mobile Bottom Navigation */}

      <div
        className="
          md:hidden fixed
          bottom-0 left-0 right-0
          z-50
          border-t border-border
          bg-background/95
          backdrop-blur-xl
        "
      >

        <div className="grid grid-cols-7 h-16">

          {
            NAV_ITEMS.map((item)=>{

              const active = isActive(item.href);

              return (

                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1',
                    active
                      ? 'text-orange-500'
                      : 'text-muted-foreground'
                  )}
                >

                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      active && 'scale-110'
                    )}
                  />

                  <span
                    className="
                      text-[9px]
                      font-bold
                      uppercase
                    "
                  >
                    {item.name}
                  </span>

                </Link>

              );

            })
          }

{/* Mobile Language */}
<div className="flex items-center justify-center">
  <LanguageSwitcher direction="up" compact />
</div>

        </div>

      </div>


    </>
  );
}