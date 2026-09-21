import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';

export function MessageList({
  messages,
  isGenerating,
  streamingMessage,
  onRegenerate,
  onEditAndResend,
  onFeedback,
  onSpeak,
  speakingMessageId,
  isSpeaking,
}) {
  return (
    <div className="messages-list-wrapper">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onRegenerate={onRegenerate}
          onEditAndResend={onEditAndResend}
          onFeedback={onFeedback}
          onSpeak={onSpeak}
          isSpeaking={isSpeaking && speakingMessageId === message.id}
        />
      ))}

      {/* Streaming response */}
      {isGenerating && streamingMessage && (
        <MessageItem
          message={{
            id: 'streaming-temp',
            role: 'assistant',
            content: streamingMessage,
            timestamp: new Date().toISOString(),
          }}
          isStreaming={true}
        />
      )}

      {/* Waiting for first token */}
      {isGenerating && !streamingMessage && (
        <div className="message-row message-assistant-row animate-fade-in">
          <div className="message-inner">
            <div className="message-avatar">
              <div className="avatar-assistant">
                <span className="sparkle-symbol">✦</span>
              </div>
            </div>
            <div className="message-content-wrapper">
              <TypingIndicator />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
