import { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Mic,
  MicOff,
  Paperclip,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export function ChatInput({ onSendMessage, onStopGenerating, isGenerating }) {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // base64 data url
  const [imageName, setImageName] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea based on content up to 200px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${Math.max(48, newHeight)}px`;
    }
  }, [text]);

  // Web Speech recognition setup
  const { isListening, isSupported: isSpeechSupported, toggleListening } =
    useSpeechRecognition({
      onResult: (spokenText) => {
        setText((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
      },
    });

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
    setSelectedImage(null);
    setImageName('');

    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  const canSubmit = (text.trim().length > 0 || selectedImage !== null) && !isGenerating;

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
            disabled={isGenerating}
          >
            <Paperclip size={19} />
          </button>

          {/* Auto-growing Textarea */}
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Groq AI... (Shift+Enter for newline)"
            rows={1}
            disabled={isGenerating}
          />

          {/* Voice Input Button */}
          {isSpeechSupported && (
            <button
              type="button"
              className={`input-tool-btn ${isListening ? 'recording-pulse' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Voice input (Dictation)'}
              aria-label="Voice input"
              disabled={isGenerating}
            >
              {isListening ? <MicOff size={19} /> : <Mic size={19} />}
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
        <span>Groq AI can make mistakes. Verify critical facts and code before production.</span>
      </div>
    </div>
  );
}
