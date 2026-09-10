'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AssistantRuntimeProvider, useExternalStoreRuntime } from '@assistant-ui/react';
import { Thread } from '@/components/assistant-ui/Thread';
import { ChatSessionsSidebar } from '@/components/ChatSessionsSidebar';
import { askCampusAI } from '@/lib/api';
import { useChatSessions, type ChatMessage } from '@/hooks/useChatSessions';
import { useAuth } from '@/context/AuthContext';
import {
  MessageSquare,
  Plus,
  PanelLeft,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  const { loginWithGoogle } = useAuth();
  const {
    sessions,
    activeSessionId,
    activeSession,
    isLoaded,
    createNewSession,
    switchSession,
    deleteSession,
    addMessageToActiveSession,
    updateSessionTitle,
    truncateMessagesFrom,
    isGuest,
    remainingGuestMessages,
    isGuestLimitReached,
  } = useChatSessions();

  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-collapse sidebar on small mobile screens initially
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const targetSessionId = activeSessionId;

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      content: content.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const currentSession = sessions.find((s) => s.id === targetSessionId);
    const existingUserCount = currentSession
      ? currentSession.messages.filter((m) => m.isUser).length
      : 0;
    const userMessageCount = existingUserCount + 1;
    const existingTitle = currentSession?.title;

    // Save user message immediately to session
    addMessageToActiveSession(userMessage, targetSessionId);
    setIsLoading(true);

    try {
      console.log(
        `[Chat] Query: "${content}" | Session: ${targetSessionId} | Prompt #${userMessageCount}`
      );
      const aiResponse = await askCampusAI(content, targetSessionId, {
        messageCount: userMessageCount,
        existingTitle,
      });

      const aiMessage: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        content: aiResponse.answer,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        location: aiResponse.location,
        webSource: aiResponse.webSource,
      };

      addMessageToActiveSession(aiMessage, targetSessionId);

      // Keep title stable: only update during prompt 1 or 2
      if (aiResponse.title && userMessageCount <= 2) {
        updateSessionTitle(targetSessionId, aiResponse.title);
      }
    } catch (err) {
      console.error('Error communicating with campus assistant backend:', err);
      addMessageToActiveSession(
        {
          id: `msg_err_${Date.now()}`,
          content:
            "I'm having trouble connecting to the campus database right now. Please try again in a moment.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        targetSessionId
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateResponse = async (
    userContent: string,
    targetSessionId: string
  ) => {
    if (!userContent.trim() || isLoading) return;

    const currentSession = sessions.find((s) => s.id === targetSessionId);
    const existingUserCount = currentSession
      ? currentSession.messages.filter((m) => m.isUser).length
      : 1;
    const existingTitle = currentSession?.title;

    setIsLoading(true);

    try {
      console.log(
        `[Chat] Regenerating response for: "${userContent}" | Session: ${targetSessionId}`
      );
      const aiResponse = await askCampusAI(userContent, targetSessionId, {
        messageCount: existingUserCount,
        existingTitle,
      });

      const aiMessage: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        content: aiResponse.answer,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        location: aiResponse.location,
        webSource: aiResponse.webSource,
      };

      addMessageToActiveSession(aiMessage, targetSessionId);
    } catch (err) {
      console.error('Error communicating with campus assistant backend:', err);
      addMessageToActiveSession(
        {
          id: `msg_err_${Date.now()}`,
          content:
            "I'm having trouble connecting to the campus database right now. Please try again in a moment.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        targetSessionId
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Check for initial prompt query (e.g. from Home page cards)
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) {
      const initialPrompt = window.sessionStorage.getItem(
        'campus-ai-initial-prompt'
      );
      if (initialPrompt) {
        window.sessionStorage.removeItem('campus-ai-initial-prompt');
        handleSendMessage(initialPrompt);
      }
    }
  }, [isLoaded]);

  const currentMessages = activeSession?.messages || [];

  const runtime = useExternalStoreRuntime({
    isRunning: isLoading,
    messages: currentMessages,
    convertMessage: (msg: ChatMessage) => ({
      id: msg.id,
      role: msg.isUser ? 'user' : 'assistant',
      content: [{ type: 'text', text: msg.content }],
      createdAt: new Date(),
      metadata: {
        custom: {
          location: msg.location,
          webSource: msg.webSource,
          timestamp: msg.timestamp,
        },
      },
    }),
    onNew: async (msg) => {
      const text = msg.content.find((c) => c.type === 'text')?.text || '';
      if (!text.trim()) return;
      await handleSendMessage(text);
    },
    onEdit: async (msg) => {
      const text = msg.content.find((c) => c.type === 'text')?.text || '';
      if (!text.trim()) return;
      if (msg.sourceId) {
        truncateMessagesFrom(msg.sourceId, activeSessionId);
      }
      await handleSendMessage(text);
    },
    onReload: async (parentId?: any, config?: any) => {
      if (isLoading) return;

      const targetSessionId = activeSessionId;
      const session =
        sessions.find((s) => s.id === targetSessionId) || activeSession;
      const msgs = session?.messages || [];
      if (msgs.length === 0) return;

      const resolvedParentId =
        typeof parentId === 'string'
          ? parentId
          : (parentId?.parentId || config?.parentId || null);

      let targetUserMsg: ChatMessage | undefined;
      let assistantMsgToReplace: ChatMessage | undefined;

      if (resolvedParentId) {
        const idx = msgs.findIndex((m) => m.id === resolvedParentId);
        if (idx !== -1) {
          if (msgs[idx].isUser) {
            targetUserMsg = msgs[idx];
            // Assistant response following this prompt
            if (idx + 1 < msgs.length && !msgs[idx + 1].isUser) {
              assistantMsgToReplace = msgs[idx + 1];
            }
          } else {
            // resolvedParentId was the assistant message itself
            assistantMsgToReplace = msgs[idx];
            if (idx > 0 && msgs[idx - 1].isUser) {
              targetUserMsg = msgs[idx - 1];
            }
          }
        }
      }

      // If parentId was not passed or couldn't be matched, find the last interaction
      if (!targetUserMsg) {
        const lastUserIdx = [...msgs]
          .map((m, i) => ({ m, i }))
          .reverse()
          .find(({ m }) => m.isUser)?.i;

        if (lastUserIdx !== undefined && lastUserIdx !== -1) {
          targetUserMsg = msgs[lastUserIdx];
          if (lastUserIdx + 1 < msgs.length && !msgs[lastUserIdx + 1].isUser) {
            assistantMsgToReplace = msgs[lastUserIdx + 1];
          }
        }
      }

      if (!targetUserMsg) return;

      // Truncate the assistant response being retried (and any following turns)
      if (assistantMsgToReplace) {
        truncateMessagesFrom(assistantMsgToReplace.id, targetSessionId);
      }

      // Regenerate the response for the selected user prompt without creating duplicate user messages
      await handleRegenerateResponse(targetUserMsg.content, targetSessionId);
    },
  });

  return (
    <DashboardLayout title="Chat with Dexa AI">
      <div className="flex h-full min-h-0 w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Chat History Sidebar */}
        <ChatSessionsSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onSelectSession={switchSession}
          onNewChat={createNewSession}
          onDeleteSession={deleteSession}
        />

        {/* Main Conversation Area */}
        <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
          {/* Top Session Bar */}
          <div className="flex items-center justify-between px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                title="Toggle conversation list"
              >
                <PanelLeft size={16} />
              </Button>

              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-indigo-500 shrink-0" />
                  <span className="truncate">
                    {activeSession?.title || 'Campus Assistant'}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={createNewSession}
                className="h-7 text-xs font-semibold flex items-center gap-1.5 rounded-lg border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-800 px-2.5 cursor-pointer"
              >
                <Plus size={13} className="text-indigo-500" />
                <span className="hidden sm:inline">New Chat</span>
              </Button>
            </div>
          </div>

          {/* @assistant-ui Thread Runtime Container */}
          <AssistantRuntimeProvider runtime={runtime}>
            <Thread
              onSuggest={handleSendMessage}
              disabled={isLoading}
              isGuest={isGuest}
              remainingGuestMessages={remainingGuestMessages}
              isGuestLimitReached={isGuestLimitReached}
              onSignIn={loginWithGoogle}
            />
          </AssistantRuntimeProvider>
        </div>
      </div>
    </DashboardLayout>
  );
}
