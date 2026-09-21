import { Menu, Plus, Sparkles, Settings, Sun, Moon, Download } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { AVAILABLE_MODELS } from '../../services/llm';
import { exportChatAsTxt } from '../../utils/exportChat';

export function Header({
  onToggleSidebar,
  onOpenSettings,
  isSidebarOpen,
}) {
  const { settings, createNewChat, activeChat } = useChat();
  const { theme, toggleTheme } = useTheme();

  const currentModelMeta =
    AVAILABLE_MODELS.find((m) => m.id === settings.model) || {
      name: settings.model || 'Qwen 3.8 27B',
    };

  return (
    <header className="chat-top-header">
      <div className="header-left-group">
        <button
          type="button"
          className="header-icon-btn"
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <button
          type="button"
          className="header-icon-btn mobile-only-btn"
          onClick={createNewChat}
          title="New chat"
          aria-label="New chat"
        >
          <Plus size={20} />
        </button>

        {/* Model Badge */}
        <button
          type="button"
          className="header-model-badge"
          onClick={onOpenSettings}
          title="Click to change model or settings"
        >
          <Sparkles size={14} color="var(--accent-primary)" />
          <span>{currentModelMeta.name}</span>
        </button>
      </div>

      <div className="header-right-group">
        {/* Quick export for active chat */}
        {activeChat && activeChat.messages.length > 0 && (
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => exportChatAsTxt(activeChat)}
            title="Download chat transcript (.txt)"
            aria-label="Download chat transcript"
          >
            <Download size={18} />
          </button>
        )}

        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Settings button */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onOpenSettings}
          title="Open Settings"
          aria-label="Open Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
