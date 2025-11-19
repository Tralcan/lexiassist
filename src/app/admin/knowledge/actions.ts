'use server';

import { knowledgeIngestionEmbedding } from '@/ai/flows/knowledge-ingestion-embedding';
import { revalidatePath } from 'next/cache';

export async function handleIngestion(prevState: any, formData: FormData) {
  const lawText = formData.get('lawText') as string;
  if (!lawText || lawText.trim().length === 0) {
    return { success: false, message: 'Law text cannot be empty.' };
  }

  try {
    const result = await knowledgeIngestionEmbedding({ lawText });
    if (result.success) {
      revalidatePath('/admin/knowledge');
      return { success: true, message: result.message };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error: any) {
    console.error('Ingestion failed:', error);
    return { success: false, message: error.message || 'An unknown error occurred.' };
  }
}
