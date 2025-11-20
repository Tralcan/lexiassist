'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getDocumentsByDate(date: string) {
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
    return { success: false, message: error.message };
  }
}

export async function deleteDocumentById(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('lex_documents').delete().match({ id });

    if (error) throw error;
    revalidatePath('/admin/knowledge-management');
    return { success: true, message: 'Fragmento eliminado con éxito.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteDocumentsByDate(date: string) {
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
    return { success: false, message: error.message };
  }
}
