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
  prompt: `You are a legal assistant specialized in Chilean law. You MUST answer in Spanish. Answer the user's question using ONLY the provided context. If the context is not sufficient, say that you don't have enough information to answer.\n\nContext:\n{{context}}\n\nQuestion: {{{question}}}`,
});

const legalConsultationRAGFlow = ai.defineFlow(
  {
    name: 'legalConsultationRAGFlow',
    inputSchema: LegalConsultationRAGInputSchema,
    outputSchema: LegalConsultationRAGOutputSchema,
  },
  async input => {
    console.log(`[RAG Flow] Starting for question: "${input.question}"`);
    const supabase = createAdminClient();

    // 1. Vectorize the user's question
    const embeddingResponse = await ai.embed({
        embedder: 'googleai/text-embedding-004',
        content: input.question,
    });
    
    // The response is an array with one object: [{ embedding: [...] }]
    // We need to extract the raw vector.
    const queryEmbedding = embeddingResponse[0]?.embedding;
    console.log('[RAG Flow] Generated query embedding:', queryEmbedding ? `Vector of dimension ${queryEmbedding.length}` : 'null');


    if (!queryEmbedding) {
        throw new Error("Failed to generate embedding for the question.");
    }

    // 2. Search Supabase for relevant legal fragments
    console.log('[RAG Flow] Searching for documents in Supabase...');
    const { data: documents, error } = await supabase.rpc('match_lex_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3, // Lowered from 0.78
        match_count: 5,
    });

    if (error) {
        console.error('[RAG Flow] Supabase RPC error:', error);
        throw new Error(`Error fetching documents from Supabase: ${error.message}`);
    }
    
    console.log(`[RAG Flow] Found ${documents?.length || 0} documents.`);


    const context = documents?.map((doc: any) => doc.content).join('\n\n') || '';
    
    if(!context){
        console.log('[RAG Flow] No context found. Returning default answer.');
        return { answer: "No tengo suficiente información en mi base de conocimiento para responder a tu pregunta." };
    }

    console.log('[RAG Flow] Context created from documents:', context.substring(0, 500) + '...');


    // 3. Call the LLM with the context and question
    console.log('[RAG Flow] Calling LLM with context...');
    const llmResponse = await prompt({question: input.question, context});
    
    console.log('[RAG Flow] Received answer from LLM.');
    return { answer: llmResponse.text };
  }
);
