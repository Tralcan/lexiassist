
import { createAdminClient } from '@/lib/supabase/admin';
import KnowledgeManager from './components/knowledge-manager';

/**
 * Obtiene las fechas únicas (en formato YYYY-MM-DD) de los documentos
 * directamente desde la base de datos de una manera segura.
 */
async function getAvailableDates(): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    // Esta función RPC fue creada para devolver directamente strings en formato YYYY-MM-DD
    const { data, error } = await supabase.rpc('get_distinct_document_dates');

    if (error) {
      console.error('Error al llamar a RPC get_distinct_document_dates:', error);
      return [];
    }
    
    // El RPC devuelve un array de objetos: [{ distinct_date: 'YYYY-MM-DD' }, ...]
    // Nos aseguramos de que es un array y extraemos solo el string de la fecha.
    if (Array.isArray(data)) {
      const dates = data.map(item => item.distinct_date).filter(Boolean); // filter(Boolean) elimina nulos/undefined
      return dates;
    }

    return [];
  } catch (e) {
    console.error("Excepción al obtener fechas disponibles:", e);
    return [];
  }
}

export default async function KnowledgeManagementPage() {
  const availableDates = await getAvailableDates();
  return <KnowledgeManager availableDates={availableDates} />;
}
