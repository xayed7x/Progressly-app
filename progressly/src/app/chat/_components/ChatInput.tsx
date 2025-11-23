'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { ArrowUp } from 'lucide-react';
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
        className="w-full"
      >
        {/* ChatGPT-style input container */}
        <div className="relative flex items-end gap-2 p-3 rounded-3xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg">
          
          {/* Textarea */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <TextareaAutosize
                    {...field}
                    maxRows={5}
                    placeholder="Message Progresso..."
                    className="w-full resize-none bg-transparent border-none p-2 text-white placeholder:text-gray-500 outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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

          {/* Send Button */}
          <Button 
            type="submit" 
            size="icon" 
            disabled={!messageValue}
            className={cn(
              "rounded-full h-8 w-8 flex-shrink-0 transition-all",
              messageValue 
                ? "bg-accent hover:bg-accent/90 text-black" 
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            )}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>

        </div>
      </form>
    </Form>
  );
}
