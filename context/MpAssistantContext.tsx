'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface MpAssistantContextType {
  isOpen: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  pendingQuestion: string | null;
  askQuestion: (question: string) => void;
  clearPendingQuestion: () => void;
}

const MpAssistantContext = createContext<MpAssistantContextType | null>(null);

export function MpAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  const openAssistant = useCallback(() => setIsOpen(true), []);
  const closeAssistant = useCallback(() => setIsOpen(false), []);
  const toggleAssistant = useCallback(() => setIsOpen(prev => !prev), []);

  const askQuestion = useCallback((question: string) => {
    setPendingQuestion(question);
    setIsOpen(true);
  }, []);

  const clearPendingQuestion = useCallback(() => {
    setPendingQuestion(null);
  }, []);

  return (
    <MpAssistantContext.Provider
      value={{
        isOpen,
        openAssistant,
        closeAssistant,
        toggleAssistant,
        pendingQuestion,
        askQuestion,
        clearPendingQuestion,
      }}
    >
      {children}
    </MpAssistantContext.Provider>
  );
}

export function useMpAssistant() {
  const context = useContext(MpAssistantContext);
  if (!context) {
    throw new Error('useMpAssistant must be used within an MpAssistantProvider');
  }
  return context;
}
