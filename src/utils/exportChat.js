/**
 * Triggers a browser file download for text/json content
 */
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports conversation as a clean, readable .txt transcript
 */
export function exportChatAsTxt(chat) {
  if (!chat || !chat.messages) return;

  const lines = [
    `Chat Title: ${chat.title || 'Conversation'}`,
    `Date: ${new Date(chat.createdAt || Date.now()).toLocaleString()}`,
    `Model: ${chat.model || 'Groq'}`,
    '='.repeat(50),
    '',
  ];

  for (const msg of chat.messages) {
    const sender = msg.role === 'user' ? 'USER' : 'ASSISTANT';
    const timestamp = msg.timestamp ? ` [${new Date(msg.timestamp).toLocaleTimeString()}]` : '';
    lines.push(`${sender}${timestamp}:`);
    lines.push(msg.content);
    if (msg.image) {
      lines.push('[Attached Image]');
    }
    lines.push('');
    lines.push('-'.repeat(30));
    lines.push('');
  }

  const filename = `${(chat.title || 'chat').replace(/[^a-z0-9_-]/gi, '_')}.txt`;
  downloadFile(filename, lines.join('\n'), 'text/plain;charset=utf-8');
}

/**
 * Exports conversation as structured .json
 */
export function exportChatAsJson(chat) {
  if (!chat) return;
  const data = JSON.stringify(chat, null, 2);
  const filename = `${(chat.title || 'chat').replace(/[^a-z0-9_-]/gi, '_')}.json`;
  downloadFile(filename, data, 'application/json;charset=utf-8');
}
