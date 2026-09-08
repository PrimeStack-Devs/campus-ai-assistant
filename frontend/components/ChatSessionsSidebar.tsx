'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Code2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChatSession } from '@/hooks/useChatSessions';
import { DeveloperTeamModal } from '@/components/DeveloperTeamModal';

interface ChatSessionsSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export function ChatSessionsSidebar({
  sessions,
  activeSessionId,
  isOpen,
  onToggle,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: ChatSessionsSidebarProps) {
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-35 lg:static flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${isOpen ? 'w-60 lg:w-64 shadow-2xl lg:shadow-none' : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0'
          } overflow-hidden shrink-0`}
      >
        <div className="w-60 lg:w-64 flex flex-col h-full">
          {/* Header */}
          <div className="p-3 px-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg text-white">
                <Sparkles size={15} />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                Chat History
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <ChevronLeft size={16} />
            </Button>
          </div>

          {/* New Chat Button */}
          <div className="p-2.5">
            <Button
              onClick={onNewChat}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-98 cursor-pointer"
            >
              <Plus size={16} />
              <span>New Chat</span>
            </Button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const dateStr = new Date(session.updatedAt).toLocaleDateString(
                undefined,
                { month: 'short', day: 'numeric' }
              );

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${isActive
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-900/50'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-5">
                    <MessageSquare
                      size={14}
                      className={
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400 shrink-0'
                          : 'text-slate-400 group-hover:text-slate-600 shrink-0'
                      }
                    />
                    <div className="truncate">
                      <p className="text-xs truncate font-medium">
                        {session.title}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={10} />
                        {dateStr} · {session.messages.length} msgs
                      </p>
                    </div>
                  </div>

                  {/* Delete Button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
          {/* Developer & Support Footer */}
          {/* Commented for now */}
          {/* <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              suppressHydrationWarning
              onClick={() => setIsDevModalOpen(true)}
              className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-200/60 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800/60 bg-white dark:bg-slate-900 shadow-xs hover:shadow-sm transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  <Code2 size={13} />
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    Engineering Team
                  </p>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-500 truncate">
                    Developers & Support
                  </p>
                </div>
              </div>
              <Users size={13} className="text-slate-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
            </button>
          </div> */}
        </div>
      </aside>

      {/* Developer & Team Modal */}
      {/* Currently commented
      <DeveloperTeamModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />
      */}
    </>
  );
}
