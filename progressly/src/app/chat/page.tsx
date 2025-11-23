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
    id: uuidv4(),
    role: 'ai', 
    content: 'Hello! I am Progresso, your AI Coach. 🌱\n\nI\'m here to help you reflect on your activities, identify patterns, and provide actionable advice to improve your productivity and well-being.\n\nHow can I help you with your progress today?' 
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const { data, error: swrError, isLoading } = useSWR<ChatHistoryResponse>('/api/chat/history', fetcher);

  const { isStreaming, isAiThinking, error: streamError, sendMessage } = useChatStream({ 
    messages, 
    setMessages 
  });

  useEffect(() => {
    if (isLoading) {
      return; 
    }
    
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent z-10"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Messages Area */}
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Welcome message when empty */}
            {messages.length === 1 && messages[0].role === 'ai' && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-accent to-blue-500 bg-clip-text text-transparent">
                  What can I help with?
                </h1>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-6">
              {messages.map((message, index) => (
                <UIChatMessage 
                  key={message.id} 
                  message={message}
                  isStreaming={isStreaming && index === messages.length - 1 && message.role === 'ai'}
                />
              ))}
              
              {isAiThinking && <ThinkingIndicator />}

              {displayError && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm font-medium">Error: {displayError.message}</p>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        {/* Scroll to bottom button */}
        {isUserScrolledUp && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20">
            <Button
              onClick={scrollToBottom}
              size="icon"
              className="rounded-full shadow-lg bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 pb-6">
          <div className="max-w-3xl mx-auto px-4">
            <ChatInput onSubmit={handleSendMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}