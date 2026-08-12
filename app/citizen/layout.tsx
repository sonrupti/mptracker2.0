'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import CitizenNavbar from '@/components/citizen/CitizenNavbar';
import Footer from '@/components/citizen/Footer';
import AskMP from '@/components/citizen/AskMP';
import { MpAssistantProvider } from '@/context/MpAssistantContext';

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <MpAssistantProvider>
      <div className="flex flex-col min-h-screen bg-background relative">
        <CitizenNavbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1 flex flex-col pb-16 md:pb-0"
          >
            {children}
          </motion.main>
        </AnimatePresence>
        <div className="pb-16 md:pb-0">
          <Footer />
        </div>

        {/* Floating MP Assistant Chatbot */}
        <AskMP />
      </div>
    </MpAssistantProvider>
  );
}
