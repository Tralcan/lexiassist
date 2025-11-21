'use server';

import { legalConsultationRAG } from '@/ai/flows/legal-consultation-rag';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ConversationState = {
  id?: string;
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
    const { data: historyData, error: historyError } = await supabase
      .from('lex_chat_history')
      .insert({
        user_id: user.id,
        question: question,
        answer: result.answer,
      })
      .select('id')
      .single();
      
    if (historyError) {
        console.error('Error guardando en el historial:', historyError);
        // No bloqueamos la respuesta al usuario, pero sí registramos el error
    }

    return { id: historyData?.id, question: question, answer: result.answer, error: '' };

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
        .select('id, question, answer')
        .eq('user_id', user.id)
        .eq('visible', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching chat history:', error);
        return [];
    }

    return (data as ConversationState[]) || [];
}

export async function clearChatHistory(): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Autenticación requerida.');
    }

    const { error: updateError } = await supabase
      .from('lex_chat_history')
      .update({ visible: false })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
    
    revalidatePath('/chat');
    return { success: true };

  } catch (error: any) {
    console.error("Error al limpiar el historial de chat:", error.message);
    return { success: false, message: error.message };
  }
}

export async function deleteSingleChatItem(historyId: string): Promise<{ success: boolean; message?: string }> {
  if (!historyId) {
    return { success: false, message: 'ID del historial no proporcionado.' };
  }
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Autenticación requerida.');
    }

    const { error: updateError } = await supabase
      .from('lex_chat_history')
      .update({ visible: false })
      .match({ id: historyId, user_id: user.id }); // Doble check de seguridad

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { success: true };

  } catch (error: any) {
    console.error("Error al eliminar el elemento del chat:", error.message);
    return { success: false, message: error.message };
  }
}
