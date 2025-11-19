'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { askQuestion } from '../actions';
import { AlertCircle, Bot, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFormStatus } from 'react-dom';

type Conversation = {
  question: string;
  answer: string;
  error?: string;
};

const initialState: Conversation = {
  question: '',
  answer: '',
  error: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Pensando...' : 'Enviar Consulta'}
    </Button>
  );
}

export default function ChatPage() {
  const [state, formAction, isPending] = useActionState(askQuestion, initialState);
  const [history, setHistory] = useState<Conversation[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isPending && state.question) {
      setHistory(prevHistory => [state, ...prevHistory]);
      formRef.current?.reset();
    }
  }, [state, isPending]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Bot /> Asistente Legal Virtual
            </CardTitle>
            <CardDescription>
                Realiza tu consulta sobre la legislación chilena. El asistente utilizará una base de conocimiento para responder.
            </CardDescription>
        </CardHeader>
        <CardContent>
             <form ref={formRef} action={formAction} className="space-y-4">
                <div className="space-y-2">
                    <Textarea
                        name="question"
                        placeholder="Escribe tu pregunta aquí..."
                        className="min-h-[100px] text-base"
                        required
                        disabled={isPending}
                    />
                </div>
                <SubmitButton />
            </form>
        </CardContent>
       </Card>

      {isPending && history.length === 0 && (
         <Card className="opacity-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                  <div className="bg-secondary text-secondary-foreground rounded-full p-2 flex items-center justify-center">
                      <User className="h-6 w-6" />
                  </div>
                  <div className="bg-muted rounded-lg p-4 w-full">
                      <p className="font-bold">Tú</p>
                      <p className="text-foreground/80 animate-pulse">...</p>
                  </div>
              </div>
            </CardContent>
          </Card>
      )}

       {history.map((conv, index) => (
        <Card key={index}>
            <CardContent className="p-4 space-y-4">
                {/* User Question */}
                <div className="flex items-start gap-4">
                    <div className="bg-secondary text-secondary-foreground rounded-full p-2 flex items-center justify-center">
                        <User className="h-6 w-6" />
                    </div>
                    <div className="bg-muted rounded-lg p-4 w-full">
                       <p className="font-bold">Tú</p>
                       <p className="text-foreground/80">{conv.question}</p>
                    </div>
                </div>

                {/* AI Answer */}
                <div className="flex items-start gap-4">
                     <div className="bg-primary text-primary-foreground rounded-full p-2 flex items-center justify-center">
                        <Bot className="h-6 w-6" />
                    </div>
                    <div className="bg-accent/50 rounded-lg p-4 w-full">
                       <p className="font-bold">LexiAssist</p>
                       {conv.error ? (
                          <div className="text-destructive flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            <p>{conv.error}</p>
                          </div>
                       ) : (
                          <p className="text-foreground/80">{conv.answer}</p>
                       )}
                    </div>
                </div>
            </CardContent>
        </Card>
       ))}
    </div>
  );
}
