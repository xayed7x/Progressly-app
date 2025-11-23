'use client';

import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div 
      className={cn(
        'flex gap-4 w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.2,
      }}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-accent" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-5 py-4',
          isUser
            ? 'bg-accent text-black'
            : 'bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white',
          message.status === 'pending' && 'opacity-60'
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="markdown-content text-sm leading-relaxed">
            <ReactMarkdown
              components={{
                // Headings
                h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 text-white">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-3 text-white">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3 text-white">{children}</h3>,
                
                // Paragraphs
                p: ({ children }) => <p className="mb-3 text-gray-100 last:mb-0">{children}</p>,
                
                // Lists
                ul: ({ children }) => <ul className="mb-3 ml-4 space-y-1.5 list-disc list-outside">{children}</ul>,
                ol: ({ children }) => <ol className="mb-3 ml-4 space-y-1.5 list-decimal list-outside">{children}</ol>,
                li: ({ children }) => <li className="text-gray-100 pl-1">{children}</li>,
                
                // Bold and italic
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
                
                // Code blocks
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-gray-900/50 px-1.5 py-0.5 rounded text-accent font-mono text-xs" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-gray-900/50 p-3 rounded-lg text-xs font-mono overflow-x-auto" {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <pre className="mb-3 overflow-x-auto">{children}</pre>,
                
                // Blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-accent/50 pl-4 py-2 my-3 bg-gray-900/30 italic text-gray-200">
                    {children}
                  </blockquote>
                ),
                
                // Horizontal rule
                hr: () => <hr className="my-4 border-gray-700" />,
                
                // Links
                a: ({ href, children }) => (
                  <a href={href} className="text-accent hover:text-accent/80 underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-accent animate-pulse" />
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
          <User className="w-5 h-5 text-blue-500" />
        </div>
      )}
    </motion.div>
  );
}
