import { createAdminClient } from '@/lib/supabase/admin';
import KnowledgeManager from './components/knowledge-manager';

async function getAvailableDates() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('get_distinct_document_dates');

  if (error) {
    console.error('Error fetching distinct dates:', error);
    return [];
  }
  return data.map((d: { distinct_date: string }) => d.distinct_date);
}

export default async function KnowledgeManagementPage() {
  const availableDates = await getAvailableDates();
  return <KnowledgeManager availableDates={availableDates} />;
}
