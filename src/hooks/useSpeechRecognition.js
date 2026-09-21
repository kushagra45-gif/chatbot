import { useState, useEffect, useRef, useCallback } from 'react';
import { transcribeAudio } from '../services/llm';

/**
 * Robust Speech-to-Text hook supporting:
 * 1. Native Web Speech API (SpeechRecognition / webkitSpeechRecognition) for live streaming dictation.
 * 2. MediaRecorder + Groq Whisper API (whisper-large-v3-turbo) fallback for universal browser support (Firefox, Brave, etc.).
 */
export function useSpeechRecognition({
  onResult,
  apiKey = '',
  language = '',
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Determine native Web Speech support
  const hasWebSpeech =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const hasMediaDevices =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const isSupported = hasWebSpeech || hasMediaDevices;

  // Stable references for callbacks and settings
  const onResultRef = useRef(onResult);
  const apiKeyRef = useRef(apiKey);
  const languageRef = useRef(language);

  useEffect(() => {
    onResultRef.current = onResult;
    apiKeyRef.current = apiKey;
    languageRef.current = language;
  }, [onResult, apiKey, language]);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Setup Web Speech Recognition if available
  useEffect(() => {
    if (!hasWebSpeech) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageRef.current || navigator.language || 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      if (text && onResultRef.current) {
        onResultRef.current(text, Boolean(finalTranscript));
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);

      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setErrorMessage(
          'Microphone permission was denied. Please allow microphone access in your browser.'
        );
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // Ignored; user just paused speaking
      } else if (event.error === 'network') {
        setErrorMessage(
          'Speech network service unavailable. Falling back to Groq Whisper voice recording.'
        );
      }
    };

    recognition.onend = () => {
      // If still supposed to be listening (and not explicitly stopped), gracefully restart
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          isListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.abort();
        } catch {
          // ignore abort error on unmount
        }
      }
    };
  }, [hasWebSpeech]);

  // Timer helper for recording duration
  const startTimer = useCallback(() => {
    setRecordingSeconds(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  /**
   * Start MediaRecorder audio capture (Whisper mode)
   */
  const startMediaRecorder = useCallback(async () => {
    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stopTimer();
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        if (audioBlob.size > 1000) {
          setIsTranscribing(true);
          try {
            const transcript = await transcribeAudio({
              audioBlob,
              apiKey: apiKeyRef.current,
              language: languageRef.current,
            });

            if (transcript && onResultRef.current) {
              onResultRef.current(transcript, true);
            }
          } catch (err) {
            console.error('Whisper transcription error:', err);
            setErrorMessage(err.message || 'Failed to transcribe audio.');
          } finally {
            setIsTranscribing(false);
          }
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      isListeningRef.current = true;
      setIsListening(true);
      startTimer();
    } catch (err) {
      console.error('MediaRecorder start error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Microphone permission was denied. Please allow microphone access in your browser settings.'
        );
      } else {
        setErrorMessage(
          `Could not access microphone: ${err.message || 'Unknown device error'}`
        );
      }
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [startTimer, stopTimer]);

  /**
   * Stop MediaRecorder audio capture
   */
  const stopMediaRecorder = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    stopTimer();

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping MediaRecorder:', err);
      }
    }
  }, [stopTimer]);

  /**
   * Start listening using Web Speech API (or MediaRecorder if unavailable)
   */
  const startListening = useCallback(async () => {
    setErrorMessage('');

    if (hasWebSpeech && recognitionRef.current) {
      try {
        isListeningRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
        startTimer();
        return;
      } catch (err) {
        console.warn('Web Speech start failed, falling back to MediaRecorder:', err);
      }
    }

    // Fallback to MediaRecorder + Whisper
    if (hasMediaDevices) {
      await startMediaRecorder();
    } else {
      setErrorMessage(
        'Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.'
      );
    }
  }, [hasWebSpeech, hasMediaDevices, startTimer, startMediaRecorder]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    stopTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      stopMediaRecorder();
    }
  }, [stopTimer, stopMediaRecorder]);

  /**
   * Toggle listening on / off
   */
  const toggleListening = useCallback(() => {
    if (isListening || isTranscribing) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, isTranscribing, startListening, stopListening]);

  const clearError = useCallback(() => {
    setErrorMessage('');
  }, []);

  return {
    isListening,
    isTranscribing,
    isSupported,
    recordingSeconds,
    errorMessage,
    clearError,
    startListening,
    stopListening,
    toggleListening,
  };
}
