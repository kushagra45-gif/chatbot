import { ArrowDown } from 'lucide-react';

export function ScrollToBottom({ onClick }) {
  return (
    <button
      className="scroll-to-bottom-btn"
      onClick={onClick}
      aria-label="Scroll to bottom"
      type="button"
      title="Scroll to bottom"
    >
      <ArrowDown size={18} />
    </button>
  );
}
