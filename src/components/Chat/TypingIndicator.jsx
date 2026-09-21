export function TypingIndicator() {
  return (
    <div className="typing-indicator-container">
      <div className="typing-dot" style={{ animationDelay: '0ms' }} />
      <div className="typing-dot" style={{ animationDelay: '200ms' }} />
      <div className="typing-dot" style={{ animationDelay: '400ms' }} />
    </div>
  );
}
