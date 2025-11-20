'use server';

import { legalConsultationRAG } from '@/ai/flows/legal-consultation-rag';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ConversationState = {
  question: string;
  answer: string;
  error?: string;
};

export async function askQuestion(prevState: any, formData: FormData) {
  const question = formData.get('question') as string;

  if (!question || question.trim().length === 0) {
    return { ...prevState, error: 'Por favor, ingresa una pregunta.' };
  }
  
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ...prevState, error: 'Debes iniciar sesión para preguntar.' };
  }

  try {
    const result = await legalConsultationRAG({ question });
    
    // Guardar en el historial
    const { error: historyError } = await supabase
      .from('lex_chat_history')
      .insert({
        user_id: user.id,
        question: question,
        answer: result.answer,
      });
      
    if (historyError) {
        console.error('Error guardando en el historial:', historyError);
        // No bloqueamos la respuesta al usuario, pero sí registramos el error
    }

    revalidatePath('/chat');
    return { question: question, answer: result.answer, error: '' };

  } catch (error: any) {
    console.error('Action Error:', error);
    return { ...prevState, question: question, answer: '', error: `Ocurrió un error inesperado: ${error.message || 'No hay mensaje de error disponible.'}` };
  }
}

export async function getChatHistory(): Promise<ConversationState[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('lex_chat_history')
        .select('question, answer')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching chat history:', error);
        return [];
    }

    return (data as ConversationState[]) || [];
}
