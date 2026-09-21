import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Text-to-Speech hook using the Web Speech API's SpeechSynthesis
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  useEffect(() => {
    const synth = synthRef.current;
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  }, []);

  const speak = useCallback(
    (text, messageId) => {
      if (!synthRef.current) return;

      // If already speaking this message, toggle off
      if (isSpeaking && speakingMessageId === messageId) {
        stop();
        return;
      }

      synthRef.current.cancel();

      // Strip markdown syntax for natural speech
      const plainText = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_~#>-]/g, '')
        .trim();

      if (!plainText) return;

      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingMessageId(messageId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      };

      synthRef.current.speak(utterance);
    },
    [isSpeaking, speakingMessageId, stop]
  );

  return {
    isSpeaking,
    speakingMessageId,
    speak,
    stop,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}
