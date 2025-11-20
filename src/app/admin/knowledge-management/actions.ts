
'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// Tipos de retorno para consistencia
type ActionResponse<T = null> = 
  | { success: true; data: T; message?: string }
  | { success: false; message: string };

type Document = {
  id: string;
  content: string;
  created_at: string;
};

export async function getDocumentsByDate(date: string): Promise<ActionResponse<Document[]>> {
  if (!date) {
    return { success: false, message: 'La fecha es requerida.' };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('lex_documents')
      .select('id, content, created_at')
      .filter('created_at', 'gte', `${date}T00:00:00Z`)
      .filter('created_at', 'lt', `${date}T23:59:59Z`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: `Error al obtener documentos: ${error.message}` };
  }
}

export async function deleteDocumentById(id: string): Promise<ActionResponse> {
  if (!id) {
    return { success: false, message: 'El ID del documento es requerido.' };
  }
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('lex_documents').delete().match({ id });

    if (error) throw error;
    revalidatePath('/admin/knowledge-management');
    return { success: true, message: 'Fragmento eliminado con éxito.' };
  } catch (error: any) {
    return { success: false, message: `Error al eliminar el fragmento: ${error.message}` };
  }
}

export async function deleteDocumentsByDate(date: string): Promise<ActionResponse> {
  if (!date) {
    return { success: false, message: 'La fecha es requerida para la eliminación masiva.' };
  }
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('lex_documents')
      .delete()
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`);
      
    if (error) throw error;
    revalidatePath('/admin/knowledge-management');
    return { success: true, message: 'Todos los fragmentos del día han sido eliminados.' };
  } catch (error: any) {
    return { success: false, message: `Error en la eliminación masiva: ${error.message}` };
  }
}
