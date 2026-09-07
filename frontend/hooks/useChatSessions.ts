'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { LocationData, WebSourceData } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  location?: LocationData;
  webSource?: WebSourceData;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'dexa_chat_sessions';
const ACTIVE_SESSION_KEY = 'dexa_active_session_id';

function generateSessionId() {
  return `dexa_session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const GUEST_QUERY_LIMIT = 5;
const GUEST_QUERY_COUNT_KEY = 'dexa_guest_query_count';

function cleanInitialTitle(query: string): string {
  if (!query) return 'New Conversation';

  let cleaned = query
    .trim()
    .replace(
      /^(who is|what is|where is|where are|how to reach|how do i get to|how to find|how many|can you tell me about|tell me about|how is|which)\s+/i,
      ''
    )
    .replace(/[?!.,;:]+$/, '')
    .trim();

  if (!cleaned) cleaned = query.trim();

  const words = cleaned.split(/\s+/).slice(0, 5);
  const capitalized = words
    .map((w) => {
      const lower = w.toLowerCase();
      if (
        ['mca', 'hod', 'cse', 'piet', 'pit', 'mba', 'bba', 'cvrc', 'btech', 'atm', 'gym', 'ai'].includes(
          lower
        )
      ) {
        return lower.toUpperCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');

  return capitalized || 'Campus Inquiry';
}

export function useChatSessions() {
  const { user, loginWithGoogle } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [guestCount, setGuestCount] = useState<number>(0);

  // Keep a ref to activeSessionId to avoid stale closures in callbacks
  const activeSessionIdRef = useRef<string>('');
  activeSessionIdRef.current = activeSessionId;

  // Load guest query count
  useEffect(() => {
    try {
      const storedCount = localStorage.getItem(GUEST_QUERY_COUNT_KEY);
      if (storedCount) {
        setGuestCount(Number(storedCount) || 0);
      }
    } catch {}
  }, []);

  const isGuest = !user;
  const remainingGuestMessages = isGuest
    ? Math.max(0, GUEST_QUERY_LIMIT - guestCount)
    : 9999;
  const isGuestLimitReached = isGuest && remainingGuestMessages <= 0;

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('dexa_chat_sessions_v2');
      let initialSessions: ChatSession[] = [];

      if (stored) {
        try {
          initialSessions = JSON.parse(stored);
        } catch {
          initialSessions = [];
        }
      }

      if (!Array.isArray(initialSessions) || initialSessions.length === 0) {
        const firstSession: ChatSession = {
          id: generateSessionId(),
          title: 'New Conversation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        initialSessions = [firstSession];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSessions));
      }

      setSessions(initialSessions);

      const savedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
      const matched = initialSessions.find((s) => s.id === savedActiveId);
      const activeId = matched ? matched.id : initialSessions[0].id;

      setActiveSessionId(activeId);
      activeSessionIdRef.current = activeId;
      localStorage.setItem(ACTIVE_SESSION_KEY, activeId);
    } catch (e) {
      console.error('Failed to load chat sessions:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Create a brand new session
  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateSessionId(),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    setSessions((prev) => {
      const updated = [newSession, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    setActiveSessionId(newSession.id);
    activeSessionIdRef.current = newSession.id;
    localStorage.setItem(ACTIVE_SESSION_KEY, newSession.id);
    return newSession.id;
  }, []);

  // 3. Switch active session
  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id);
    activeSessionIdRef.current = id;
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  }, []);

  // 4. Delete session
  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      let updated = filtered;
      if (updated.length === 0) {
        const fresh: ChatSession = {
          id: generateSessionId(),
          title: 'New Conversation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        updated = [fresh];
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }

      if (activeSessionIdRef.current === id) {
        const nextId = updated[0].id;
        setActiveSessionId(nextId);
        activeSessionIdRef.current = nextId;
        localStorage.setItem(ACTIVE_SESSION_KEY, nextId);
      }

      return updated;
    });
  }, []);

  // 5. Clear all sessions
  const clearAllSessions = useCallback(() => {
    const freshSession: ChatSession = {
      id: generateSessionId(),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    setSessions([freshSession]);
    setActiveSessionId(freshSession.id);
    activeSessionIdRef.current = freshSession.id;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([freshSession]));
      localStorage.setItem(ACTIVE_SESSION_KEY, freshSession.id);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 6. Add message to active session (Atomic functional update to prevent race conditions)
  const addMessageToActiveSession = useCallback(
    (message: ChatMessage, targetSessionId?: string) => {
      const targetId = targetSessionId || activeSessionIdRef.current;

      setSessions((prevSessions) => {
        const updated = prevSessions.map((session) => {
          if (session.id === targetId) {
            let newTitle = session.title;
            // Generate clean initial title from first user message
            if (
              message.isUser &&
              (session.title === 'New Conversation' ||
                session.messages.length === 0)
            ) {
              newTitle = cleanInitialTitle(message.content);
            }

            return {
              ...session,
              title: newTitle,
              updatedAt: new Date().toISOString(),
              messages: [...session.messages, message],
            };
          }
          return session;
        });

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to persist chat sessions:', e);
        }

        // Increment guest message count if not authenticated
        if (message.isUser && !user) {
          setGuestCount((prev) => {
            const next = prev + 1;
            try {
              localStorage.setItem(GUEST_QUERY_COUNT_KEY, String(next));
            } catch {}
            return next;
          });
        }

        return updated;
      });
    },
    [user]
  );

  // 7. Update session title from AI response (stable after prompt 1 or 2)
  const updateSessionTitle = useCallback((id: string, newTitle: string) => {
    if (!newTitle || !newTitle.trim()) return;
    const clean = newTitle.trim();

    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          const userMsgCount = s.messages.filter((m) => m.isUser).length;
          // Keep title stable: do NOT change after the 2nd user prompt
          if (userMsgCount > 2 && s.title && s.title !== 'New Conversation') {
            return s;
          }
          return { ...s, title: clean, updatedAt: new Date().toISOString() };
        }
        return s;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return {
    sessions,
    activeSessionId,
    activeSession,
    isLoaded,
    createNewSession,
    switchSession,
    deleteSession,
    clearAllSessions,
    addMessageToActiveSession,
    updateSessionTitle,
    isGuest,
    remainingGuestMessages,
    isGuestLimitReached,
    guestQueryLimit: GUEST_QUERY_LIMIT,
  };
}
