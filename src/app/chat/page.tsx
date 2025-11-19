'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { askQuestion } from '../actions';
import { AlertCircle, Bot, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const initialState = {
  answer: '',
  error: '',
};

export default function ChatPage() {
  const [state, formAction] = useActionState(askQuestion, initialState);
  
  return (
    <div className="max-w-3xl mx-auto">
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
             <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                    <Textarea
                        name="question"
                        placeholder="Escribe tu pregunta aquí..."
                        className="min-h-[100px] text-base"
                        required
                    />
                </div>
                <Button type="submit" className="w-full">Enviar Consulta</Button>
            </form>

            {state?.error && (
                <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{state.error}</AlertDescription>
                </Alert>
            )}

            {state?.answer && (
                <div className="mt-6 space-y-4">
                    <div className="flex items-start gap-4">
                         <div className="bg-primary text-primary-foreground rounded-full p-2 flex items-center justify-center">
                            <Bot className="h-6 w-6" />
                        </div>
                        <div className="bg-muted rounded-lg p-4 w-full">
                           <p className="font-bold">LexiAssist</p>
                           <p className="text-foreground/80">{state.answer}</p>
                        </div>
                    </div>
                </div>
            )}
        </CardContent>
       </Card>
    </div>
  );
}
