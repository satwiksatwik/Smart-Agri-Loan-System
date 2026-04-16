import { useCallback, useRef } from 'react';

const LANG_CODES = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
};

const useSpeechSynthesis = (language = 'en') => {
  const utteranceRef = useRef(null);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODES[language] || 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const langCode = LANG_CODES[language] || 'en-IN';
    const matchingVoice = voices.find((v) => v.lang === langCode) ||
      voices.find((v) => v.lang.startsWith(langCode.split('-')[0]));

    if (matchingVoice) utterance.voice = matchingVoice;

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
};

export default useSpeechSynthesis;
