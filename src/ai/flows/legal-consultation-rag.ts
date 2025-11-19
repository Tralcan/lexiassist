'use server';

/**
 * @fileOverview A legal consultation AI agent using RAG.
 *
 * - legalConsultationRAG - A function that handles the legal consultation process.
 * - LegalConsultationRAGInput - The input type for the legalConsultationRAG function.
 * - LegalConsultationRAGOutput - The return type for the legalConsultationRAG function.
 */

import {ai} from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/admin';
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
  input: {schema: z.object({
    question: z.string(),
    context: z.string(),
  })},
  output: {schema: LegalConsultationRAGOutputSchema},
  prompt: `You are a legal assistant specialized in Chilean law. You MUST answer in Spanish. Answer the user's question using ONLY the provided context. If the context is not sufficient, say that you don't have enough information to answer.\n\nContext:\n{{context}}\n\nQuestion: {{{question}}}`,
});

const legalConsultationRAGFlow = ai.defineFlow(
  {
    name: 'legalConsultationRAGFlow',
    inputSchema: LegalConsultationRAGInputSchema,
    outputSchema: LegalConsultationRAGOutputSchema,
  },
  async input => {
    const supabase = createAdminClient();

    // 1. Vectorize the user's question
    const embeddingResult = await ai.embed({
        embedder: 'googleai/text-embedding-004',
        content: input.question,
    });
    
    const queryEmbedding = embeddingResult.embedding;


    // 2. Search Supabase for relevant legal fragments
    const { data: documents, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.78,
        match_count: 5,
    });

    if (error) {
        throw new Error(`Error fetching documents from Supabase: ${error.message}`);
    }

    const context = documents.map((doc: any) => doc.content).join('\n\n');
    
    if(!context){
        return { answer: "No tengo suficiente información en mi base de conocimiento para responder a tu pregunta." };
    }

    // 3. Call the LLM with the context and question
    const {output} = await prompt({...input, context});
    return output!;
  }
);
