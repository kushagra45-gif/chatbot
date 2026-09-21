import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCcw,
  Pencil,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { formatTimestamp } from '../../utils/formatters';

export function MessageItem({
  message,
  isStreaming = false,
  onRegenerate,
  onEditAndResend,
  onFeedback,
  onSpeak,
  isSpeaking = false,
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (editText.trim() && editText !== message.content) {
      onEditAndResend(message.id, editText);
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`message-row ${isUser ? 'message-user-row' : 'message-assistant-row'} animate-fade-in`}
    >
      <div className="message-inner">
        {/* Avatar */}
        <div className="message-avatar" aria-hidden="true">
          {isUser ? (
            <div className="avatar-user">
              <User size={18} />
            </div>
          ) : (
            <div className="avatar-assistant">
              <Sparkles size={18} />
            </div>
          )}
        </div>

        {/* Content Column */}
        <div className="message-content-wrapper">
          {/* Header with Name & Timestamp */}
          <div className="message-header-meta">
            <span className="message-author">{isUser ? 'User' : 'Kushagra'}</span>
            {message.timestamp && (
              <span className="message-timestamp" title={new Date(message.timestamp).toLocaleString()}>
                {formatTimestamp(message.timestamp)}
              </span>
            )}
          </div>

          {/* User message edit mode vs view mode */}
          {isUser && isEditing ? (
            <form onSubmit={handleSaveEdit} className="edit-message-form">
              <textarea
                className="edit-message-textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="edit-message-actions">
                <button
                  type="button"
                  className="edit-btn-cancel"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(message.content || '');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="edit-btn-save" disabled={!editText.trim()}>
                  Save & Submit
                </button>
              </div>
            </form>
          ) : (
            <div className="message-body">
              {/* Image attachment if present */}
              {message.image && (
                <div className="message-attached-image">
                  <img
                    src={message.image}
                    alt="Attached preview"
                    className="attached-img-preview"
                  />
                </div>
              )}

              {/* Render User plain text or Assistant Markdown */}
              {isUser ? (
                <p className="user-message-text">{message.content}</p>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: CodeBlock,
                      a: ({ _node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {isStreaming && <span className="streaming-cursor" />}
                </div>
              )}
            </div>
          )}

          {/* Action Toolbar (visible on hover / active) */}
          {!isEditing && !isStreaming && (
            <div className="message-actions-toolbar">
              {/* Copy */}
              <button
                className="msg-action-btn"
                onClick={handleCopy}
                title="Copy message"
                aria-label="Copy message"
                type="button"
              >
                {copied ? <Check size={14} color="#10a37f" /> : <Copy size={14} />}
              </button>

              {/* User Edit */}
              {isUser && onEditAndResend && (
                <button
                  className="msg-action-btn"
                  onClick={() => setIsEditing(true)}
                  title="Edit message"
                  aria-label="Edit message"
                  type="button"
                >
                  <Pencil size={14} />
                </button>
              )}

              {/* Assistant Actions */}
              {!isUser && (
                <>
                  {/* Text to speech */}
                  {onSpeak && (
                    <button
                      className={`msg-action-btn ${isSpeaking ? 'active-speaking' : ''}`}
                      onClick={() => onSpeak(message.content, message.id)}
                      title={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
                      aria-label="Read aloud"
                      type="button"
                    >
                      {isSpeaking ? (
                        <VolumeX size={14} color="#10a37f" />
                      ) : (
                        <Volume2 size={14} />
                      )}
                    </button>
                  )}

                  {/* Regenerate */}
                  {onRegenerate && (
                    <button
                      className="msg-action-btn"
                      onClick={() => onRegenerate(message.id)}
                      title="Regenerate response"
                      aria-label="Regenerate response"
                      type="button"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}

                  {/* Thumbs up */}
                  {onFeedback && (
                    <button
                      className={`msg-action-btn ${message.feedback === 'like' ? 'feedback-liked' : ''}`}
                      onClick={() => onFeedback(message.id, 'like')}
                      title="Good response"
                      aria-label="Good response"
                      type="button"
                    >
                      <ThumbsUp size={14} />
                    </button>
                  )}

                  {/* Thumbs down */}
                  {onFeedback && (
                    <button
                      className={`msg-action-btn ${message.feedback === 'dislike' ? 'feedback-disliked' : ''}`}
                      onClick={() => onFeedback(message.id, 'dislike')}
                      title="Bad response"
                      aria-label="Bad response"
                      type="button"
                    >
                      <ThumbsDown size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
