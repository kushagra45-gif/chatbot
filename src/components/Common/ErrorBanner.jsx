import { AlertCircle, RotateCcw, Settings } from 'lucide-react';

export function ErrorBanner({ error, onRetry, onOpenSettings }) {
  if (!error) return null;

  const isApiKeyIssue =
    typeof error.message === 'string' &&
    (error.message.toLowerCase().includes('api key') ||
      error.message.toLowerCase().includes('permission'));

  return (
    <div className="error-banner animate-fade-in" role="alert">
      <div className="error-banner-content">
        <AlertCircle size={18} color="var(--accent-danger)" />
        <span>{error.message}</span>
      </div>

      <div className="error-banner-actions">
        {onRetry && (
          <button
            type="button"
            className="error-action-btn error-action-retry"
            onClick={onRetry}
          >
            <RotateCcw size={13} style={{ display: 'inline', marginRight: 4 }} />
            Retry
          </button>
        )}

        {isApiKeyIssue && onOpenSettings && (
          <button
            type="button"
            className="error-action-btn error-action-settings"
            onClick={onOpenSettings}
          >
            <Settings size={13} style={{ display: 'inline', marginRight: 4 }} />
            Settings
          </button>
        )}
      </div>
    </div>
  );
}
