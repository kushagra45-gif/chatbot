import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react';

export function ChatListItem({
  chat,
  isActive,
  onSelect,
  onRename,
  onDelete,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleSaveRename = (e) => {
    e.stopPropagation();
    if (editTitle.trim() && editTitle !== chat.title) {
      onRename(chat.id, editTitle.trim());
    }
    setIsRenaming(false);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setIsRenaming(false);
    setEditTitle(chat.title);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveRename(e);
    } else if (e.key === 'Escape') {
      handleCancelRename(e);
    }
  };

  return (
    <div
      className={`sidebar-chat-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(chat.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(chat.id);
        }
      }}
    >
      <MessageSquare size={16} className="chat-item-icon" />

      {isRenaming ? (
        <div className="chat-rename-input-wrap" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            type="text"
            className="chat-rename-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="chat-rename-action-btn"
            onClick={handleSaveRename}
            title="Save title"
            aria-label="Save title"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            className="chat-rename-action-btn"
            onClick={handleCancelRename}
            title="Cancel"
            aria-label="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <span className="chat-item-title" title={chat.title}>
            {chat.title}
          </span>
          <div className="chat-item-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="chat-action-icon-btn"
              onClick={() => setIsRenaming(true)}
              title="Rename conversation"
              aria-label="Rename conversation"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              className="chat-action-icon-btn hover-danger"
              onClick={() => onDelete(chat.id)}
              title="Delete conversation"
              aria-label="Delete conversation"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
