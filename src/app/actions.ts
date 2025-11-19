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
  } catch (error) {
    console.error(error);
    return { answer: '', error: 'An unexpected error occurred. Please try again.' };
  }
}
