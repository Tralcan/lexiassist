'use server';

/**
 * @fileOverview A legal consultation AI agent using RAG.
 *
 * - legalConsultationRAG - A function that handles the legal consultation process.
 * - LegalConsultationRAGInput - The input type for the legalConsultationRAG function.
 * - LegalConsultationRAGOutput - The return type for the legalConsultationRAG function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LegalConsultationRAGInputSchema = z.object({
  question: z.string().describe('The legal question to ask.'),
});
export type LegalConsultationRAGInput = z.infer<typeof LegalConsultationRAGInputSchema>;

const LegalConsultationRAGOutputSchema = z.object({
  answer: z.string().describe('The answer to the legal question.'),
});
export type LegalConsultationRAGOutput = z.infer<typeof LegalConsultationRAGOutputSchema>;

export async function legalConsultationRAG(input: LegalConsultationRAGInput): Promise<LegalConsultationRAGOutput> {
  return legalConsultationRAGFlow(input);
}

const prompt = ai.definePrompt({
  name: 'legalConsultationRAGPrompt',
  input: {schema: LegalConsultationRAGInputSchema},
  output: {schema: LegalConsultationRAGOutputSchema},
  prompt: `You are a legal assistant specialized in Chilean law. Answer the user's question using the provided context.\n\nContext:\n{{context}}\n\nQuestion: {{{question}}}`,
});

const legalConsultationRAGFlow = ai.defineFlow(
  {
    name: 'legalConsultationRAGFlow',
    inputSchema: LegalConsultationRAGInputSchema,
    outputSchema: LegalConsultationRAGOutputSchema,
  },
  async input => {
    // TODO: Implement vectorizing the question and searching Supabase for relevant legal fragments.
    // For now, use a placeholder context.
    const context = 'This is a placeholder context. Replace with actual legal fragments from Supabase.';

    const {output} = await prompt({...input, context});
    return output!;
  }
);
