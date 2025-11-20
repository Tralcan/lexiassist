'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { askQuestion, getChatHistory } from '../actions';
import { AlertCircle, Bot, User, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Skeleton } from '@/components/ui/skeleton';


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
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Pensando...
        </>
      ) : (
        'Enviar Consulta'
      )}
    </Button>
  );
}

export default function ChatPage() {
  const [state, formAction, isPending] = useActionState(askQuestion, initialState);
  const [history, setHistory] = useState<Conversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Cargar el historial al montar el componente
  useEffect(() => {
    async function loadHistory() {
      setIsLoadingHistory(true);
      const pastConversations = await getChatHistory();
      setHistory(pastConversations);
      setIsLoadingHistory(false);
    }
    loadHistory();
  }, []);


  // Actualizar el historial cuando llega una nueva respuesta
  useEffect(() => {
    if (!isPending && state.question && state.answer) {
       // Evitar duplicados si la página se recarga por revalidatePath
      if (!history.some(h => h.question === state.question && h.answer === state.answer)) {
         setHistory(prevHistory => [state, ...prevHistory]);
      }
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
                Realiza tu consulta sobre la legislación chilena. Tu historial de conversación se guardará aquí.
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
                 {state?.error && !state.answer && (
                    <div className="text-destructive flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <p>{state.error}</p>
                    </div>
                )}
            </form>
        </CardContent>
       </Card>
      
      {isLoadingHistory ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isPending && history.length === 0 ? (
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
      ) : (
         history.map((conv, index) => (
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
                            <p className="text-foreground/80 whitespace-pre-wrap">{conv.answer}</p>
                         )}
                      </div>
                  </div>
              </CardContent>
          </Card>
         ))
      )}
    </div>
  );
}
