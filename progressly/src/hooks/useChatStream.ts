// In /progressly/src/hooks/useChatStream.ts
'use client';

import { useState, Dispatch, SetStateAction } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Message } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface UseChatStreamProps {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

interface UseChatStreamReturn {
  isStreaming: boolean;
  isAiThinking: boolean;
  error: Error | null;
  sendMessage: (userMessage: string) => Promise<void>;
}

export const useChatStream = ({ messages, setMessages }: UseChatStreamProps): UseChatStreamReturn => {
  const supabase = useSupabaseClient();
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = async (userMessage: string) => {
    setError(null);
    setIsAiThinking(true);

    // Track when thinking started for minimum duration
    const thinkingStartTime = Date.now();
    const MIN_THINKING_DURATION = 800; // milliseconds

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();

    // If there is no session, we cannot proceed.
    if (!session) {
      setError(new Error('Not authenticated. Please log in.'));
      setIsAiThinking(false);
      return;
    }

    // Step 1: Optimistically add user message and AI placeholder
    const userMessageObj: Message = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      status: 'sent',
    };

    const aiPlaceholderId = uuidv4();
    const aiPlaceholder: Message = {
      id: aiPlaceholderId,
      role: 'ai',
      content: '',
    };

    // Add both messages to state immediately
    const updatedMessages = [...messages, userMessageObj, aiPlaceholder];
    setMessages(updatedMessages);

    // Store timeout reference for cleanup (declared outside try for proper scoping)
    let typingTimeout: NodeJS.Timeout | null = null;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: updatedMessages.filter(m => m.id !== aiPlaceholderId).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content,
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty.');
      }

      // Step 2: Start reading the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let firstChunkReceived = false;
      
      // Buffer for accumulating chunks before character-by-character typing
      let chunkBuffer = '';
      let displayedContent = '';
      let isTyping = false;
      
      // Typing animation configuration
      const TYPING_DELAY = 20; // milliseconds per character (adjust for speed - lower = faster)
      const BATCH_SIZE = 1; // Characters to type at once (1 = true character-by-character)

      // Function to type characters one by one
      const typeCharacter = () => {
        if (chunkBuffer.length === 0) {
          isTyping = false;
          typingTimeout = null;
          return;
        }
        
        // Take characters from buffer
        const charsToType = chunkBuffer.slice(0, BATCH_SIZE);
        chunkBuffer = chunkBuffer.slice(BATCH_SIZE);
        displayedContent += charsToType;
        
        // Update the message with the new characters
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          if (lastMessage && lastMessage.id === aiPlaceholderId) {
            return [
              ...prevMessages.slice(0, -1),
              { ...lastMessage, content: displayedContent },
            ];
          }
          return prevMessages;
        });
        
        // Continue typing if there's more in the buffer
        if (chunkBuffer.length > 0) {
          typingTimeout = setTimeout(typeCharacter, TYPING_DELAY);
        } else {
          isTyping = false;
          typingTimeout = null;
        }
      };

      // Step 3: Process stream chunks
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          
          // On first chunk, ensure minimum thinking time, then hide indicator
          if (!firstChunkReceived) {
            const elapsedTime = Date.now() - thinkingStartTime;
            const remainingTime = Math.max(0, MIN_THINKING_DURATION - elapsedTime);
            
            if (remainingTime > 0) {
              await new Promise(resolve => setTimeout(resolve, remainingTime));
            }
            
            setIsAiThinking(false);
            setIsStreaming(true);
            firstChunkReceived = true;
          }
          
          // Add chunk to buffer
          chunkBuffer += chunk;
          
          // Start typing animation if not already running
          if (!isTyping && chunkBuffer.length > 0) {
            isTyping = true;
            typeCharacter();
          }
        }
      }
      
      // After stream is done, finish typing any remaining characters in buffer
      // Use a recursive function to handle the remaining buffer
      const finishTyping = () => {
        if (chunkBuffer.length > 0) {
          const charsToType = chunkBuffer.slice(0, BATCH_SIZE);
          chunkBuffer = chunkBuffer.slice(BATCH_SIZE);
          displayedContent += charsToType;
          
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage && lastMessage.id === aiPlaceholderId) {
              return [
                ...prevMessages.slice(0, -1),
                { ...lastMessage, content: displayedContent },
              ];
            }
            return prevMessages;
          });
          
          if (chunkBuffer.length > 0) {
            typingTimeout = setTimeout(finishTyping, TYPING_DELAY);
          } else {
            isTyping = false;
            typingTimeout = null;
          }
        } else {
          isTyping = false;
          typingTimeout = null;
        }
      };
      
      // Start finishing the remaining buffer if there's any
      if (chunkBuffer.length > 0 && !isTyping) {
        isTyping = true;
        finishTyping();
      }
      
      // Wait for typing to complete (with a reasonable timeout)
      const maxWaitTime = 30000; // 30 seconds max
      const startWaitTime = Date.now();
      while (isTyping && (Date.now() - startWaitTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      // Clear any pending typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }
      
      setError(err instanceof Error ? err : new Error('An unknown error occurred.'));
      
      // Remove the AI placeholder on error
      setMessages((prevMessages) => 
        prevMessages.filter(m => m.id !== aiPlaceholderId)
      );
    } finally {
      // Clear any pending timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      setIsStreaming(false);
      setIsAiThinking(false);
    }
  };

  return { isStreaming, isAiThinking, error, sendMessage };
};
