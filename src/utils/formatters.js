/**
 * Formats a timestamp into friendly relative or absolute strings
 */
export function formatTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Creates a succinct chat title from the first message
 */
export function generateChatTitle(firstMessageText) {
  if (!firstMessageText) return 'New Chat';
  const clean = firstMessageText
    .replace(/^[\s\n#*`]+/, '')
    .split('\n')[0]
    .trim();
  if (clean.length <= 32) return clean || 'New Chat';
  return clean.slice(0, 32).trim() + '...';
}

/**
 * Groups chats into chronological categories: Today, Yesterday, Previous 7 Days, Older
 */
export function groupChatsByDate(chats) {
  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const yesterday = today - oneDay;
  const sevenDaysAgo = today - 7 * oneDay;

  for (const chat of chats) {
    const time = new Date(chat.updatedAt || chat.createdAt || 0).getTime();
    if (time >= today) {
      groups.today.push(chat);
    } else if (time >= yesterday) {
      groups.yesterday.push(chat);
    } else if (time >= sevenDaysAgo) {
      groups.previous7Days.push(chat);
    } else {
      groups.older.push(chat);
    }
  }

  return [
    { label: 'Today', chats: groups.today },
    { label: 'Yesterday', chats: groups.yesterday },
    { label: 'Previous 7 Days', chats: groups.previous7Days },
    { label: 'Older', chats: groups.older },
  ].filter((group) => group.chats.length > 0);
}
