import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatArea } from './components/Chat/ChatArea';
import { SettingsModal } from './components/Modals/SettingsModal';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider, useChat } from './context/ChatContext';
import './components/Sidebar/Sidebar.css';
import './components/Modals/Modals.css';

function ChatAppInner() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  });
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { createNewChat } = useChat();

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K -> New chat
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        createNewChat();
      }
      // Cmd/Ctrl + B or Cmd/Ctrl + / -> Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === '/')) {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      // Escape -> close settings or close sidebar on mobile
      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isMobile && isSidebarOpen) {
          setIsSidebarOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewChat, isSettingsOpen, isMobile, isSidebarOpen]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="app-layout">
      {/* Collapsible / Responsive Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMobile={isMobile}
      />

      {/* Main Chat Interface */}
      <ChatArea
        onToggleSidebar={toggleSidebar}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Settings Dialog Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <ChatAppInner />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
