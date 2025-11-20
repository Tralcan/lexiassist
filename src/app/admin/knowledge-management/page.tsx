import { createAdminClient } from '@/lib/supabase/admin';
import KnowledgeManager from './components/knowledge-manager';

async function getAvailableDates() {
  const supabase = createAdminClient();
  // El RPC devuelve un array de strings directamente, no un array de objetos.
  const { data, error } = await supabase.rpc('get_distinct_document_dates');

  if (error) {
    console.error('Error fetching distinct dates:', error);
    return [];
  }
  // No es necesario mapear, 'data' ya es el array de strings de fecha.
  return data || [];
}

export default async function KnowledgeManagementPage() {
  const availableDates = await getAvailableDates();
  return <KnowledgeManager availableDates={availableDates} />;
}
