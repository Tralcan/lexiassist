'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import { Paperclip, SendHorizonal, Bot } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { askQuestion } from './actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Header from '@/components/header';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const initialState = {
  answer: '',
  error: '',
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [formState, formAction] = useActionState(askQuestion, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formState.answer) {
      setMessages((prev) => [...prev, { role: 'assistant', content: formState.answer }]);
    }
    if (formState.error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${formState.error}` }]);
    }
  }, [formState]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const question = formData.get('question') as string;
    if (question.trim()) {
      setMessages((prev) => [...prev, { role: 'user', content: question }]);
    }
    formAction(formData);
    formRef.current?.reset();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 flex justify-center items-center p-4 md:p-6">
        <Card className="w-full max-w-4xl h-[calc(100vh-100px)] flex flex-col shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Legal Consultation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8 border">
                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20} /></AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[75%] rounded-lg p-3 text-sm ${
                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      <p>{message.content}</p>
                    </div>
                     {message.role === 'user' && (
                      <Avatar className="w-8 h-8 border">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-auto pt-4 border-t">
              <form ref={formRef} onSubmit={handleFormSubmit} className="relative">
                <Textarea
                  name="question"
                  placeholder="Type your legal question here..."
                  className="w-full resize-none pr-28"
                  rows={2}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        formRef.current?.requestSubmit();
                      }
                    }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Button type="button" size="icon" variant="ghost">
                    <Paperclip className="w-5 h-5" />
                    <span className="sr-only">Attach file</span>
                  </Button>
                  <Button type="submit" size="icon">
                    <SendHorizonal className="w-5 h-5" />
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
