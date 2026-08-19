'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChatWindow } from '@/components/ChatWindow';
import { ChatInput } from '@/components/ChatInput';
import { askCampusAI, type LocationData, type WebSourceData } from '@/lib/api';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  location?: LocationData;
  webSource?: WebSourceData;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Get AI response
    console.log('Sending query to backend:', content);
    try {
      const aiResponse = await askCampusAI(content);
      console.log("AI Response received:", aiResponse);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.answer,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: aiResponse.location,
        webSource: aiResponse.webSource,
      };
      console.log('Adding AI message to chat:', aiMessage);
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error communicating with campus assistant backend:", err);
      // fallback message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I'm having trouble connecting to the campus service right now. Please try again later.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialPrompt = window.sessionStorage.getItem('campus-ai-initial-prompt');
      if (initialPrompt) {
        window.sessionStorage.removeItem('campus-ai-initial-prompt');
        handleSendMessage(initialPrompt);
      }
    }
  }, []);

  return (
    <DashboardLayout title="Chat with Campus AI">
      <div className="flex h-full min-h-0 flex-col bg-slate-50 dark:bg-slate-950">
        <ChatWindow messages={messages} isLoading={isLoading} onSuggest={handleSendMessage} />
        <ChatInput onSubmit={handleSendMessage} disabled={isLoading} />
      </div>
    </DashboardLayout>
  );
}
