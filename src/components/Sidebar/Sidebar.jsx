import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  X,
  Sparkles,
} from 'lucide-react';
import { ChatListItem } from './ChatListItem';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { groupChatsByDate } from '../../utils/formatters';

export function Sidebar({
  isOpen,
  onClose,
  onOpenSettings,
  isMobile,
}) {
  const {
    chats,
    activeChatId,
    selectChat,
    createNewChat,
    renameChat,
    deleteChat,
  } = useChat();

  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter chats by title or message content
  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return chats;
    return chats.filter((c) => {
      const titleMatch = c.title?.toLowerCase().includes(q);
      const messageMatch = c.messages?.some((m) =>
        m.content?.toLowerCase().includes(q)
      );
      return titleMatch || messageMatch;
    });
  }, [chats, searchQuery]);

  const dateGroups = useMemo(() => {
    return groupChatsByDate(filteredChats);
  }, [filteredChats]);

  const handleSelectChat = (id) => {
    selectChat(id);
    if (isMobile) {
      onClose();
    }
  };

  const handleNewChat = () => {
    createNewChat();
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobile && isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : 'closed'}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <button
            type="button"
            className="new-chat-btn"
            onClick={handleNewChat}
          >
            <div className="new-chat-btn-inner">
              <Plus size={18} />
              <span>New chat</span>
            </div>
            <span className="shortcut-badge">⌘K</span>
          </button>

          {isMobile ? (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          ) : (
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={onClose}
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        {/* Search Chats Input */}
        <div className="sidebar-search-box">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Conversation List */}
        <div className="sidebar-chat-list">
          {filteredChats.length === 0 ? (
            <div className="sidebar-empty-state">
              {searchQuery ? 'No chats found.' : 'No conversations yet.'}
            </div>
          ) : searchQuery ? (
            // Flat list when searching
            <div className="date-group-section">
              <span className="date-group-title">Search Results</span>
              {filteredChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === activeChatId}
                  onSelect={handleSelectChat}
                  onRename={renameChat}
                  onDelete={deleteChat}
                />
              ))}
            </div>
          ) : (
            // Grouped list by date
            dateGroups.map((group) => (
              <div key={group.label} className="date-group-section">
                <span className="date-group-title">{group.label}</span>
                {group.chats.map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeChatId}
                    onSelect={handleSelectChat}
                    onRename={renameChat}
                    onDelete={deleteChat}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="footer-profile">
            <div className="footer-avatar">
              <Sparkles size={16} color="var(--accent-primary)" />
            </div>
            <div className="footer-text-group">
              <span className="footer-user-name">ChatGPT Clone</span>
              <span className="footer-user-sub">Groq Powered</span>
            </div>
          </div>

          <div className="footer-actions">
            {/* Dark / Light Toggle */}
            <button
              type="button"
              className="footer-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Settings Trigger */}
            <button
              type="button"
              className="footer-btn"
              onClick={onOpenSettings}
              title="Settings"
              aria-label="Open settings"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
