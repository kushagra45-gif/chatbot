import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  streamChatCompletion,
  DEFAULT_MODEL,
  DEFAULT_SYSTEM_PROMPT,
  AVAILABLE_MODELS,
  getApiKey,
} from '../services/llm';
import { generateChatTitle } from '../utils/formatters';

const ChatContext = createContext(null);

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatProvider({ children }) {
  // Stored chats
  const [chats, setChats] = useLocalStorage('chatgpt_chats', []);
  const [activeChatId, setActiveChatId] = useLocalStorage('chatgpt_active_chat_id', null);

  // Settings
  const [settings, setSettings] = useLocalStorage('chatgpt_settings', {
    apiKey: getApiKey(''),
    model: DEFAULT_MODEL,
    temperature: 0.7,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
  });

  // Auto-migrate stale model or load env key if storage is out of sync
  useEffect(() => {
    const isModelValid = AVAILABLE_MODELS.some((m) => m.id === settings.model);
    const envKey = import.meta.env.VITE_API_KEY?.trim() || '';

    if (!isModelValid || (!settings.apiKey && envKey)) {
      setSettings((prev) => ({
        ...prev,
        model: isModelValid ? prev.model : DEFAULT_MODEL,
        apiKey: prev.apiKey || envKey,
      }));
    }
  }, [settings.model, settings.apiKey, setSettings]);

  // Ephemeral streaming & error states
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState(null); // { message: string, canRetry: boolean, lastPayload: object }

  const abortControllerRef = useRef(null);
  const currentGeneratingChatIdRef = useRef(null);

  // Current active chat object
  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  // Create new conversation
  const createNewChat = useCallback(() => {
    // If active chat is already empty, just stay on it
    if (activeChat && activeChat.messages.length === 0) {
      return activeChat.id;
    }

    const newChat = {
      id: generateId(),
      title: 'New chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: settings.model,
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setError(null);
    return newChat.id;
  }, [activeChat, settings.model, setChats, setActiveChatId]);

  // Select existing conversation
  const selectChat = useCallback((id) => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setStreamingMessage('');
    }
    setActiveChatId(id);
    setError(null);
  }, [isGenerating, setActiveChatId]);

  // Delete conversation
  const deleteChat = useCallback((id) => {
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (activeChatId === id) {
        if (remaining.length > 0) {
          setActiveChatId(remaining[0].id);
        } else {
          setActiveChatId(null);
        }
      }
      return remaining;
    });
  }, [activeChatId, setChats, setActiveChatId]);

  // Rename conversation
  const renameChat = useCallback((id, newTitle) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, title: trimmed, updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, [setChats]);

  // Clear all conversations
  const clearAllChats = useCallback(() => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setStreamingMessage('');
    }
    setChats([]);
    setActiveChatId(null);
    setError(null);
  }, [isGenerating, setChats, setActiveChatId]);

  // Stop generation
  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const targetChatId = currentGeneratingChatIdRef.current;
    if (targetChatId && streamingMessage.trim()) {
      const partialAssistantMsg = {
        id: generateId(),
        role: 'assistant',
        content: streamingMessage + '\n\n*(Generation stopped)*',
        timestamp: new Date().toISOString(),
        feedback: null,
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === targetChatId
            ? {
                ...c,
                messages: [...c.messages, partialAssistantMsg],
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    }

    setIsGenerating(false);
    setStreamingMessage('');
    currentGeneratingChatIdRef.current = null;
  }, [streamingMessage, setChats]);

  // Core generation trigger
  const executeGeneration = useCallback(
    async (chatId, messageHistory) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      currentGeneratingChatIdRef.current = chatId;

      setIsGenerating(true);
      setStreamingMessage('');
      setError(null);

      try {
        let accumulated = '';
        await streamChatCompletion({
          messages: messageHistory,
          apiKey: settings.apiKey,
          model: settings.model,
          temperature: settings.temperature,
          systemPrompt: settings.systemPrompt,
          signal: controller.signal,
          onChunk: (chunk, fullText) => {
            accumulated = fullText;
            setStreamingMessage(fullText);
          },
        });

        // Add assistant reply to conversation
        if (accumulated.trim()) {
          const assistantMsg = {
            id: generateId(),
            role: 'assistant',
            content: accumulated,
            timestamp: new Date().toISOString(),
            feedback: null,
          };

          setChats((prev) =>
            prev.map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    messages: [...c.messages, assistantMsg],
                    updatedAt: new Date().toISOString(),
                  }
                : c
            )
          );
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError({
            message: err.message || 'An unexpected error occurred while generating a response.',
            canRetry: true,
            chatId,
            messageHistory,
          });
        }
      } finally {
        setIsGenerating(false);
        setStreamingMessage('');
        abortControllerRef.current = null;
        currentGeneratingChatIdRef.current = null;
      }
    },
    [settings, setChats]
  );

  // Send a new message
  const sendMessage = useCallback(
    async ({ text, image }) => {
      if ((!text || !text.trim()) && !image) return;
      if (isGenerating) return;

      let targetChatId = activeChatId;

      // If no active chat, create one
      if (!targetChatId) {
        const newChat = {
          id: generateId(),
          title: generateChatTitle(text || 'Image inquiry'),
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          model: settings.model,
        };
        targetChatId = newChat.id;
        setActiveChatId(newChat.id);
        setChats((prev) => [newChat, ...prev]);
      }

      const userMsg = {
        id: generateId(),
        role: 'user',
        content: text ? text.trim() : '',
        image: image || null,
        timestamp: new Date().toISOString(),
      };

      let currentMessages = [];
      setChats((prev) => {
        const target = prev.find((c) => c.id === targetChatId);
        const existingMessages = target ? target.messages : [];
        const isFirstMessage = existingMessages.length === 0;

        currentMessages = [...existingMessages, userMsg];

        return prev.map((c) =>
          c.id === targetChatId
            ? {
                ...c,
                title: isFirstMessage ? generateChatTitle(text || 'Image inquiry') : c.title,
                messages: currentMessages,
                updatedAt: new Date().toISOString(),
              }
            : c
        );
      });

      // Small delay to ensure state queue completes
      setTimeout(() => {
        executeGeneration(targetChatId, currentMessages);
      }, 20);
    },
    [activeChatId, isGenerating, settings.model, setActiveChatId, setChats, executeGeneration]
  );

  // Regenerate assistant response
  const regenerateResponse = useCallback(
    (messageId) => {
      if (isGenerating || !activeChat) return;

      const messages = activeChat.messages;
      let targetIndex = -1;

      if (messageId) {
        targetIndex = messages.findIndex((m) => m.id === messageId);
      } else {
        // Last assistant message by default
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'assistant') {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex === -1) return;

      // Keep messages up to the user message immediately preceding this assistant message
      const trimmedHistory = messages.slice(0, targetIndex);
      if (trimmedHistory.length === 0) return;

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                messages: trimmedHistory,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );

      setTimeout(() => {
        executeGeneration(activeChat.id, trimmedHistory);
      }, 20);
    },
    [activeChat, isGenerating, setChats, executeGeneration]
  );

  // Edit user message and re-generate
  const editAndResendMessage = useCallback(
    (messageId, newContent) => {
      if (isGenerating || !activeChat || !newContent.trim()) return;

      const messages = activeChat.messages;
      const targetIndex = messages.findIndex((m) => m.id === messageId);
      if (targetIndex === -1) return;

      const updatedUserMsg = {
        ...messages[targetIndex],
        content: newContent.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [...messages.slice(0, targetIndex), updatedUserMsg];

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                messages: updatedHistory,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );

      setTimeout(() => {
        executeGeneration(activeChat.id, updatedHistory);
      }, 20);
    },
    [activeChat, isGenerating, setChats, executeGeneration]
  );

  // Retry after error
  const retryLastMessage = useCallback(() => {
    if (!error || !error.chatId || !error.messageHistory) return;
    const { chatId, messageHistory } = error;
    setError(null);
    executeGeneration(chatId, messageHistory);
  }, [error, executeGeneration]);

  // Set thumbs up/down feedback
  const setFeedback = useCallback(
    (messageId, feedbackType) => {
      if (!activeChat) return;

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        feedback: m.feedback === feedbackType ? null : feedbackType,
                      }
                    : m
                ),
              }
            : c
        )
      );
    },
    [activeChat, setChats]
  );

  const updateSettings = useCallback(
    (newSettings) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [setSettings]
  );

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        activeChatId,
        isGenerating,
        streamingMessage,
        error,
        settings,
        createNewChat,
        selectChat,
        deleteChat,
        renameChat,
        clearAllChats,
        sendMessage,
        stopGenerating,
        regenerateResponse,
        editAndResendMessage,
        retryLastMessage,
        setFeedback,
        updateSettings,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
