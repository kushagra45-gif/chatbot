import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowUp,
  Square,
  Mic,
  MicOff,
  Paperclip,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useChat } from '../../context/ChatContext';

export function ChatInput({ onSendMessage, onStopGenerating, isGenerating }) {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // base64 data url
  const [imageName, setImageName] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const baseTextRef = useRef('');

  const { settings } = useChat();

  // Auto-resize textarea based on content up to 200px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${Math.max(48, newHeight)}px`;
    }
  }, [text]);

  // Speech recognition callback
  const handleSpeechResult = useCallback((spokenText, isFinal) => {
    const base = baseTextRef.current;
    const cleanSpoken = spokenText.trim();
    if (!cleanSpoken) return;

    const newText = base ? `${base} ${cleanSpoken}` : cleanSpoken;
    setText(newText);

    if (isFinal) {
      baseTextRef.current = newText;
    }
  }, []);

  // Web Speech recognition & Whisper fallback setup
  const {
    isListening,
    isTranscribing,
    isSupported: isSpeechSupported,
    recordingSeconds,
    errorMessage,
    clearError,
    toggleListening,
  } = useSpeechRecognition({
    onResult: handleSpeechResult,
    apiKey: settings?.apiKey,
  });

  const handleMicClick = () => {
    if (!isListening && !isTranscribing) {
      baseTextRef.current = text.trim();
    }
    toggleListening();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPEG, WebP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Reset input so re-uploading the same file works
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageName('');
  };

  const handleSubmit = () => {
    if (isGenerating) return;
    if (!text.trim() && !selectedImage) return;

    onSendMessage({ text, image: selectedImage });
    setText('');
    baseTextRef.current = '';
    setSelectedImage(null);
    setImageName('');

    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  const canSubmit = (text.trim().length > 0 || selectedImage !== null) && !isGenerating;

  // Format recording timer: mm:ss
  const formattedRecordingTime = `${String(
    Math.floor(recordingSeconds / 60)
  ).padStart(2, '0')}:${String(recordingSeconds % 60).padStart(2, '0')}`;

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-container">
        {/* Attached image preview banner */}
        {selectedImage && (
          <div className="attached-image-preview-bar">
            <div className="preview-image-thumb-wrap">
              <img src={selectedImage} alt="Attachment" className="preview-image-thumb" />
              <button
                type="button"
                className="remove-image-btn"
                onClick={handleRemoveImage}
                title="Remove image"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
            <span className="preview-image-name">{imageName || 'Attached image'}</span>
          </div>
        )}

        {/* Voice recording live status */}
        {isListening && (
          <div className="voice-status-bar">
            <div className="voice-status-left">
              <span className="recording-dot" />
              <span className="recording-text">Listening...</span>
              <span className="recording-time">{formattedRecordingTime}</span>
            </div>
            <span className="voice-stop-hint">Click mic or Send when done</span>
          </div>
        )}

        {/* Voice transcribing status (Whisper mode) */}
        {isTranscribing && (
          <div className="voice-status-bar">
            <div className="voice-status-left">
              <div className="transcribing-spinner" />
              <span className="recording-text">Transcribing audio with Groq Whisper...</span>
            </div>
          </div>
        )}

        {/* Voice error toast */}
        {errorMessage && (
          <div className="voice-error-toast">
            <div className="voice-status-left">
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              className="voice-error-close"
              onClick={clearError}
              aria-label="Dismiss message"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <div className="chat-input-row">
          {/* File attachment hidden input & button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="input-tool-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image for vision model"
            aria-label="Attach image"
            disabled={isGenerating || isListening}
          >
            <Paperclip size={19} />
          </button>

          {/* Auto-growing Textarea */}
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              baseTextRef.current = e.target.value;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message ChatGPT Clone... (Shift+Enter for newline)"
            rows={1}
            disabled={isGenerating}
          />

          {/* Voice Input Button */}
          {isSpeechSupported && (
            <button
              type="button"
              className={`input-tool-btn ${isListening ? 'recording-pulse' : ''}`}
              onClick={handleMicClick}
              title={
                isListening
                  ? 'Stop listening'
                  : isTranscribing
                  ? 'Transcribing...'
                  : 'Voice input (Microphone)'
              }
              aria-label="Voice input"
              disabled={isGenerating || isTranscribing}
            >
              {isTranscribing ? (
                <Loader2 size={19} className="spin-icon" />
              ) : isListening ? (
                <MicOff size={19} />
              ) : (
                <Mic size={19} />
              )}
            </button>
          )}

          {/* Send / Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              className="send-stop-btn stop-state"
              onClick={onStopGenerating}
              title="Stop generating"
              aria-label="Stop generating"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              className={`send-stop-btn ${canSubmit ? 'can-send' : 'disabled'}`}
              onClick={handleSubmit}
              disabled={!canSubmit}
              title="Send message"
              aria-label="Send message"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <div className="chat-disclaimer">
        <span>ChatGPT Clone can make mistakes. Verify critical facts and code before production.</span>
      </div>
    </div>
  );
}
