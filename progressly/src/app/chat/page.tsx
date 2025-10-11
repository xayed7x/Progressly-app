'use client';

import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { ThinkingIndicator } from './_components/ThinkingIndicator';
import { useChatStream } from '@/hooks/useChatStream';
import { ChatInput } from './_components/ChatInput';
import { ChatMessage as UIChatMessage } from './_components/ChatMessage';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

// Define the interfaces for our data types
interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  created_at?: string; // Optional for local messages
}

interface ChatHistoryResponse {
  id: string;
  created_at: string;
  messages: Message[];
}

const initialWelcomeMessage: Message[] = [
  { 
    id: uuidv4(), // Use a unique ID
    role: 'ai', 
    content: 'Hello! I am Progresso, your AI Coach. 🌱\n\nI\'m here to help you reflect on your activities, identify patterns, and provide actionable advice to improve your productivity and well-being.\n\nHow can I help you with your progress today?' 
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // ✅ --- CORRECTED: Added the fetcher function as the second argument
  const { data, error: swrError, isLoading } = useSWR<ChatHistoryResponse>('/api/chat/history', fetcher);

  const { isStreaming, isAiThinking, error: streamError, sendMessage } = useChatStream({ 
    messages, 
    setMessages 
  });

  // ✅ --- SIMPLIFIED: More robust effect logic
  useEffect(() => {
    // Wait until the fetch is complete
    if (isLoading) {
      return; 
    }
    
    // If we have history data, use it. Otherwise, use the welcome message.
    if (data && data.messages.length > 0) {
      setMessages(data.messages);
    } else {
      setMessages(initialWelcomeMessage);
    }
  }, [data, isLoading]);

  const handleSendMessage = (data: { message: string }) => {
    sendMessage(data.message);
  };

  useEffect(() => {
    if (!isUserScrolledUp) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isUserScrolledUp]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsUserScrolledUp(!isAtBottom);
  };
  

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsUserScrolledUp(false);
  };

  const displayError = swrError || streamError;

  // Show a single loading state until the initial fetch is done
  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading chat history...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-grow p-4 space-y-4 overflow-y-auto scroll-smooth"
      >
        {messages.map((message) => (
          <UIChatMessage key={message.id} message={message} />
        ))}
        
        {isAiThinking && <ThinkingIndicator />}

        {displayError && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive text-sm font-medium">Error: {displayError.message}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {isUserScrolledUp && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10">
          <Button
            onClick={scrollToBottom}
            size="icon"
            className="rounded-full shadow-lg bg-accent hover:bg-accent/90 text-black"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="flex-shrink-0 border-t bg-primary">
        <ChatInput onSubmit={handleSendMessage} />
      </div>
    </div>
  );
}