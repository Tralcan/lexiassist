'use server';

import { legalConsultationRAG } from '@/ai/flows/legal-consultation-rag';

export async function askQuestion(prevState: any, formData: FormData) {
  const question = formData.get('question') as string;

  if (!question || question.trim().length === 0) {
    return { answer: '', error: 'Please enter a question.' };
  }

  try {
    const result = await legalConsultationRAG({ question });
    return { answer: result.answer, error: '' };
  } catch (error: any) {
    console.error('Action Error:', error);
    // Return the specific error message to the UI instead of a generic one.
    return { answer: '', error: `An unexpected error occurred: ${error.message || 'No error message available.'}` };
  }
}
