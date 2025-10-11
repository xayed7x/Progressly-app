'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import TextareaAutosize from 'react-textarea-autosize';

const formSchema = z.object({
  message: z.string().min(1, {
    message: 'Message cannot be empty.',
  }),
});

interface ChatInputProps {
  onSubmit: (values: { message: string }) => void;
}

export function ChatInput({ onSubmit }: ChatInputProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const messageValue = form.watch('message');

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values);
    form.reset();
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)} 
        className="p-4 border-t bg-background"
      >
        {/* This is our new "Pill" Container */}
        <div className="flex items-center p-2 px-4 rounded-full bg-primary border border-textLight">
          
          {/* The seamless FormField and Textarea */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-grow !border-none">
                <FormControl className="!border-none">
                  <TextareaAutosize
                    {...field}
                    maxRows={5}
                    placeholder="Ask your AI Coach..."
                    className="w-full resize-none bg-transparent border-none p-2 outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(handleSubmit)();
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* The seamless Ghost Button */}
          <Button type="submit" size="icon" variant="ghost" disabled={!messageValue}>
            <Send className={cn('w-5 h-5 text-accent transition-opacity', messageValue ? 'opacity-100' : 'opacity-50')} />
          </Button>

        </div>
      </form>
    </Form>
  );
}
