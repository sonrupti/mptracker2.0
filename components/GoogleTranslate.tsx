'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
    __googleTranslateReady?: boolean;
    __googleTranslateCallbacks?: Array<() => void>;
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
  id?: string; // unique container id — required when mounting more than once (e.g. desktop + mobile)
}

export default function GoogleTranslate({ id = 'google_translate_element' }: GoogleTranslateProps) {

  useEffect(() => {
    const initThisInstance = () => {
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

    // If Google's script already finished loading (e.g. this instance mounted later),
    // just init immediately.
    if (window.__googleTranslateReady) {
      initThisInstance();
      return;
    }

    // Otherwise, register this instance's init function in a shared queue.
    // Every mounted GoogleTranslate instance pushes its own callback here,
    // regardless of mount order or effect timing.
    if (!window.__googleTranslateCallbacks) {
      window.__googleTranslateCallbacks = [];
    }
    window.__googleTranslateCallbacks.push(initThisInstance);

    // The actual Google script callback — set once, runs every queued callback.
    window.googleTranslateElementInit = () => {
      window.__googleTranslateReady = true;
      window.__googleTranslateCallbacks?.forEach((fn) => fn());
    };

    // Only append the script tag once, no matter how many instances mount.
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

    <div className="flex items-center gap-2">

      <button
        onClick={resetToEnglish}
        className="
          flex items-center gap-1
          text-[12px]
          font-semibold
          text-indigo-400
          hover:text-indigo-300
          transition-colors
        "
      >
        🌐 English
      </button>

    </div>

  </div>
);
   
}