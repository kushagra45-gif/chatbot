import { useState, useEffect } from 'react';
import {
  X,
  Key,
  Sliders,
  Sparkles,
  Trash2,
  Download,
  FileText,
  FileJson,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { AVAILABLE_MODELS, DEFAULT_SYSTEM_PROMPT } from '../../services/llm';
import { exportChatAsTxt, exportChatAsJson } from '../../utils/exportChat';

export function SettingsModal({ isOpen, onClose }) {
  const {
    settings,
    updateSettings,
    activeChat,
    clearAllChats,
  } = useChat();

  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [model, setModel] = useState(settings.model);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Sync internal state when settings change or modal opens
  useEffect(() => {
    if (isOpen) {
      setApiKey(settings.apiKey || '');
      setModel(settings.model);
      setTemperature(settings.temperature);
      setSystemPrompt(settings.systemPrompt);
      setSavedSuccess(false);
      setConfirmClearAll(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({
      apiKey: apiKey.trim(),
      model,
      temperature: parseFloat(temperature),
      systemPrompt: systemPrompt.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetPrompt = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  const handleClearAll = () => {
    clearAllChats();
    setConfirmClearAll(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Sliders size={20} className="modal-icon" />
            <h2 className="modal-title">Settings</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="modal-body">
          {/* API Key Section */}
          <div className="settings-section">
            <div className="section-label-group">
              <label htmlFor="api-key-input" className="settings-label">
                <Key size={16} />
                <span>Groq API Key (Free)</span>
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="helper-link"
              >
                Get Free API Key ↗
              </a>
            </div>
            <div className="api-key-input-wrapper">
              <input
                id="api-key-input"
                type={showApiKey ? 'text' : 'password'}
                className="settings-input"
                placeholder="gsk_... (leave blank to use .env VITE_API_KEY)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowApiKey(!showApiKey)}
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="settings-hint">
              Free API key from Groq Console. Stored safely in your browser’s localStorage or <code>.env</code>.
            </p>
          </div>

          {/* Model Selection */}
          <div className="settings-section">
            <label htmlFor="model-select" className="settings-label">
              <Sparkles size={16} />
              <span>Model</span>
            </label>
            <select
              id="model-select"
              className="settings-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.description}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature Slider */}
          <div className="settings-section">
            <div className="temperature-header">
              <label htmlFor="temp-slider" className="settings-label">
                <span>Creativity / Temperature</span>
              </label>
              <span className="temp-badge">{temperature}</span>
            </div>
            <input
              id="temp-slider"
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              className="settings-range"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
            <div className="range-markers">
              <span>0.0 (Precise)</span>
              <span>0.7 (Balanced)</span>
              <span>1.5 (Creative)</span>
            </div>
          </div>

          {/* Custom System Prompt */}
          <div className="settings-section">
            <div className="section-label-group">
              <label htmlFor="system-prompt" className="settings-label">
                <span>System Instructions</span>
              </label>
              <button
                type="button"
                className="reset-prompt-btn"
                onClick={handleResetPrompt}
                title="Reset to default prompt"
              >
                <RotateCcw size={12} />
                <span>Reset Default</span>
              </button>
            </div>
            <textarea
              id="system-prompt"
              className="settings-textarea"
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Instructions that guide AI behavior..."
            />
          </div>

          {/* Export Chat Section */}
          {activeChat && activeChat.messages.length > 0 && (
            <div className="settings-section export-section">
              <label className="settings-label">
                <Download size={16} />
                <span>Export Current Conversation</span>
              </label>
              <div className="export-actions-row">
                <button
                  type="button"
                  className="export-btn"
                  onClick={() => exportChatAsTxt(activeChat)}
                >
                  <FileText size={15} />
                  <span>Download .TXT</span>
                </button>
                <button
                  type="button"
                  className="export-btn"
                  onClick={() => exportChatAsJson(activeChat)}
                >
                  <FileJson size={15} />
                  <span>Download .JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* Clear All Chats */}
          <div className="settings-section danger-section">
            <label className="settings-label danger-text">
              <Trash2 size={16} />
              <span>Data Management</span>
            </label>
            {confirmClearAll ? (
              <div className="confirm-clear-row">
                <span>Are you sure? This cannot be undone.</span>
                <div className="confirm-clear-btns">
                  <button
                    type="button"
                    className="cancel-clear-btn"
                    onClick={() => setConfirmClearAll(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="danger-confirm-btn"
                    onClick={handleClearAll}
                  >
                    Yes, Clear All
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="danger-btn"
                onClick={() => setConfirmClearAll(true)}
              >
                Clear all chats from browser
              </button>
            )}
          </div>

          {/* Footer Save / Cancel */}
          <div className="modal-footer">
            <button
              type="button"
              className="modal-footer-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-footer-save"
            >
              {savedSuccess ? (
                <>
                  <Check size={16} />
                  <span>Saved!</span>
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
