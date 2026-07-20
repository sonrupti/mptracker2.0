'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

function resetToEnglish() {
  document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
  document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
  window.location.reload();
}

export default function GoogleTranslate() {
  useEffect(() => {
    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'hi,or,ta,te,bn,mr,gu,kn,ml,pa',
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="space-y-1.5">
      <div id="google_translate_element" className="translate-widget" />
      <button
        onClick={resetToEnglish}
        className="text-[12px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        Reset to English
      </button>
    </div>
  );
}