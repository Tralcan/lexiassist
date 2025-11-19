'use server';

import { legalConsultationRAG } from '@/ai/flows/legal-consultation-rag';

export async function askQuestion(prevState: any, formData: FormData) {
  const question = formData.get('question') as string;

  if (!question || question.trim().length === 0) {
    return { question: '', answer: '', error: 'Por favor, ingresa una pregunta.' };
  }

  try {
    const result = await legalConsultationRAG({ question });
    return { question: question, answer: result.answer, error: '' };
  } catch (error: any) {
    console.error('Action Error:', error);
    // Return the specific error message to the UI instead of a generic one.
    return { question: question, answer: '', error: `Ocurrió un error inesperado: ${error.message || 'No hay mensaje de error disponible.'}` };
  }
}
