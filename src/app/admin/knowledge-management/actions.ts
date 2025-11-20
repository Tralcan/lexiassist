
'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// Tipos de retorno para consistencia
type ActionResponse<T = null> = 
  | { success: true; data?: T; message?: string }
  | { success: false; message: string };

export type Document = {
  id: string;
  content: string;
  created_at: string;
};

export async function getAvailableDates(): Promise<ActionResponse<string[]>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('get_distinct_document_dates');

    if (error) {
      console.error('Error al llamar a RPC get_distinct_document_dates:', error);
      throw new Error(error.message);
    }
    
    if (Array.isArray(data)) {
      const dates = data.map(item => item.distinct_date).filter(Boolean);
      return { success: true, data: dates };
    }

    return { success: true, data: [] };
  } catch (e: any) {
    console.error("Excepción al obtener fechas disponibles:", e);
    return { success: false, message: e.message || "Error desconocido al obtener fechas." };
  }
}


export async function getDocumentsByDate(date: string): Promise<ActionResponse<Document[]>> {
  if (!date) {
    return { success: false, message: 'La fecha es requerida.' };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('lex_documents')
      .select('id, content, created_at')
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data as Document[] };
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

export async function updateDocumentContent(id: string, content: string): Promise<ActionResponse> {
  if (!id || !content) {
    return { success: false, message: 'Se requiere ID y contenido para actualizar.' };
  }
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('lex_documents')
      .update({ content })
      .match({ id });

    if (error) throw error;
    revalidatePath('/admin/knowledge-management');
    return { success: true, message: 'Fragmento actualizado con éxito.' };
  } catch (error: any) {
    return { success: false, message: `Error al actualizar el fragmento: ${error.message}` };
  }
}
