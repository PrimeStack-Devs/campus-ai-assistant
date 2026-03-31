'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChatWindow } from '@/components/ChatWindow';
import { ChatInput } from '@/components/ChatInput';
import { askCampusAI, type LocationData } from '@/lib/api';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  location?: LocationData;
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
    // setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Get AI response
    console.log('Sending query to backend:', content);
    const aiResponse = await askCampusAI(content);
    console.log("AI Response received:", aiResponse);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: aiResponse.answer,
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: aiResponse.location,
    };
    console.log('Adding AI message to chat:', aiMessage);

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  return (
    <DashboardLayout title="Chat with Campus AI">
      <div className="h-full flex flex-col">
        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput onSubmit={handleSendMessage} disabled={isLoading} />
      </div>
    </DashboardLayout>
  );
}
