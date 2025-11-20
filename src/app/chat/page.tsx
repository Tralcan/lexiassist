'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { askQuestion, getChatHistory, clearChatHistory } from '../actions';
import { AlertCircle, Bot, User, Loader2, Scale, Trash2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

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

const Answer = ({ text }: { text: string }) => {
  if (!text) return null;

  const sourceKeywords = ['Fuente Legal:', 'Fuente:', 'Fuentes Legales:'];
  let mainAnswer = text;
  let sourceText = '';
  let splitKeyword = '';

  for (const keyword of sourceKeywords) {
    if (text.includes(keyword)) {
      splitKeyword = keyword;
      break;
    }
  }

  if (splitKeyword) {
    const parts = text.split(splitKeyword);
    mainAnswer = parts[0].trim();
    sourceText = parts.slice(1).join(splitKeyword).trim();
  }

  return (
    <div className="text-foreground/80 whitespace-pre-wrap">
      <p>{mainAnswer}</p>
      {sourceText && (
        <div className="mt-4 pt-3 border-t border-primary/20">
            <h4 className="flex items-center text-sm font-semibold text-foreground/70 mb-2">
                <Scale className="h-4 w-4 mr-2"/>
                Fuente Legal
            </h4>
            <p className="text-sm text-foreground/60">{sourceText}</p>
        </div>
      )}
    </div>
  );
};


export default function ChatPage() {
  const [state, formAction, isPending] = useActionState(askQuestion, initialState);
  const [history, setHistory] = useState<Conversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    async function loadHistory() {
      setIsLoadingHistory(true);
      const pastConversations = await getChatHistory();
      setHistory(pastConversations.filter(c => c.question && c.answer));
      setIsLoadingHistory(false);
    }
    loadHistory();
  }, []);

  useEffect(() => {
    if (!isPending && state.question && state.answer) {
      setHistory(prevHistory => [state, ...prevHistory]);
      formRef.current?.reset();
    }
  }, [state, isPending]);

  const handleClearHistory = async () => {
    const result = await clearChatHistory();
    if(result.success) {
        setHistory([]);
        toast({ title: "Éxito", description: "El historial de chat ha sido limpiado."});
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                    <Bot /> Asistente Legal Virtual
                </CardTitle>
                <CardDescription>
                    Realiza tu consulta sobre la legislación chilena. Tu historial de conversación se guardará aquí.
                </CardDescription>
              </div>
              {history.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpiar Historial
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro de limpiar el historial?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción ocultará permanentemente todas tus conversaciones. No podrás recuperarlas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">
                        Sí, limpiar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
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
                            <Answer text={conv.answer} />
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
