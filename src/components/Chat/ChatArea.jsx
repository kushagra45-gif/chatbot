import { useEffect } from 'react';
import { Header } from '../Common/Header';
import { WelcomeScreen } from './WelcomeScreen';
import { MessageList } from './MessageList';
import { ScrollToBottom } from './ScrollToBottom';
import { ErrorBanner } from '../Common/ErrorBanner';
import { ChatInput } from '../Input/ChatInput';
import { useChat } from '../../context/ChatContext';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import './Chat.css';
import '../Input/ChatInput.css';

export function ChatArea({
  onToggleSidebar,
  onOpenSettings,
  isSidebarOpen,
}) {
  const {
    activeChat,
    isGenerating,
    streamingMessage,
    error,
    sendMessage,
    stopGenerating,
    regenerateResponse,
    editAndResendMessage,
    retryLastMessage,
    setFeedback,
  } = useChat();

  const messages = activeChat?.messages || [];
  const hasMessages = messages.length > 0 || isGenerating;

  // Auto scroll hook tied to messages length and streaming text changes
  const {
    containerRef,
    isScrolledUp,
    scrollToBottom,
    handleScroll,
  } = useAutoScroll([messages.length, streamingMessage]);

  // Speech synthesis for reading messages aloud
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    speakingMessageId,
  } = useSpeechSynthesis();

  // Stop speaking if generating new response or unmounting
  useEffect(() => {
    if (isGenerating) {
      stopSpeaking();
    }
  }, [isGenerating, stopSpeaking]);

  const handleSuggestionClick = (promptText) => {
    sendMessage({ text: promptText });
  };

  return (
    <main className="chat-area-container">
      {/* Top Navigation Bar */}
      <Header
        onToggleSidebar={onToggleSidebar}
        onOpenSettings={onOpenSettings}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Messages / Welcome Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="messages-scroll-area"
      >
        {!hasMessages ? (
          <WelcomeScreen onSelectSuggestion={handleSuggestionClick} />
        ) : (
          <div className="messages-list-wrapper">
            <MessageList
              messages={messages}
              isGenerating={isGenerating}
              streamingMessage={streamingMessage}
              onRegenerate={regenerateResponse}
              onEditAndResend={editAndResendMessage}
              onFeedback={setFeedback}
              onSpeak={speak}
              speakingMessageId={speakingMessageId}
              isSpeaking={isSpeaking}
            />

            {/* Inline Error Banner */}
            {error && (
              <ErrorBanner
                error={error}
                onRetry={retryLastMessage}
                onOpenSettings={onOpenSettings}
              />
            )}
          </div>
        )}
      </div>

      {/* Scroll To Bottom Button */}
      {isScrolledUp && hasMessages && (
        <ScrollToBottom onClick={() => scrollToBottom('smooth')} />
      )}

      {/* Bottom Message Input */}
      <ChatInput
        onSendMessage={sendMessage}
        onStopGenerating={stopGenerating}
        isGenerating={isGenerating}
      />
    </main>
  );
}
