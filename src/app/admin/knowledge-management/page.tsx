
import { createAdminClient } from '@/lib/supabase/admin';
import KnowledgeManager from './components/knowledge-manager';

async function getAvailableDates(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('get_distinct_document_dates');

  // --- DEBUGGING LOG (SERVER) ---
  console.log('[SERVER-SIDE] Raw data from Supabase RPC:', JSON.stringify(data, null, 2));
  console.log('[SERVER-SIDE] RPC Error:', error);

  if (error || !data) {
    console.error('Error fetching distinct dates:', error);
    return [];
  }
  
  // Safely map the data to an array of strings
  const dates = Array.isArray(data) ? data.map(item => item.distinct_date).filter(Boolean) : [];
  
  // --- DEBUGGING LOG (SERVER) ---
  console.log('[SERVER-SIDE] Processed dates to be passed to client:', dates);

  return dates;
}

export default async function KnowledgeManagementPage() {
  const availableDates = await getAvailableDates();
  return <KnowledgeManager availableDates={availableDates} />;
}
