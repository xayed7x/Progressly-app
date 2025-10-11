'use client';

import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div 
      className={cn('flex items-start', isUser && 'justify-end')}
      initial={{ opacity: 0, y: 8 }} // Start invisible and 8px down
      animate={{ opacity: 1, y: 0 }} // Animate to fully visible and in its final position
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.2,
      }}
    >
      <div
        className={cn(
          'p-3 rounded-xl max-w-sm bg-primary',
          isUser
            ? 'border border-accent rounded-br-sm'
            : 'border border-transparent rounded-bl-sm',
          message.status === 'pending' && 'opacity-60' // Add this condition
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap text-secondary">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
