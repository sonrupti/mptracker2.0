'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

function resetToEnglish() {
  document.cookie =
    'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';

  document.cookie =
    `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC`;

  window.location.reload();
}

interface GoogleTranslateProps {
  id?: string; // unique container id when mounted more than once (e.g. desktop + mobile)
}

export default function GoogleTranslate({ id = 'google_translate_element' }: GoogleTranslateProps) {

  useEffect(() => {
    const initializeTranslator = () => {
      const container = document.getElementById(id);
      if (
        window.google &&
        window.google.translate &&
        container &&
        container.childNodes.length === 0
      ) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "hi,or,ta,te,bn,mr,gu,kn,ml,pa",
            autoDisplay: false,
          },
          id
        );
      }
    };

    // If google.translate is already loaded, just try to init this instance
    if (window.google?.translate) {
      initializeTranslator();
      return;
    }

    // Chain onto any previously-set init callback so multiple instances don't clobber each other
    const previousInit = window.googleTranslateElementInit;
    window.googleTranslateElementInit = () => {
      previousInit?.();
      initializeTranslator();
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [id]);

  return (
    <div className="min-w-[140px] space-y-1.5">

      <div
        id={id}
        className="translate-widget min-h-[40px]"
      />

      <button
        onClick={resetToEnglish}
        className="
          text-[12px]
          font-semibold
          text-indigo-400
          hover:text-indigo-300
          transition-colors
        "
      >
        Reset to English
      </button>

    </div>
  );
}