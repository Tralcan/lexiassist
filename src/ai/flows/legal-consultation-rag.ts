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
import { googleAI } from '@genkit-ai/google-genai';

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
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `Eres un asistente legal experto en legislación chilena. Tu tarea es responder la pregunta del usuario utilizando exclusivamente el contexto legal que se te proporciona.

Instrucciones estrictas:
1.  Tu respuesta DEBE estar en español.
2.  Basa tu respuesta ÚNICAMENTE en el texto del 'Contexto'. No inventes información ni uses conocimiento externo.
3.  Al final de tu respuesta, DEBES incluir una sección llamada "Fuente Legal" donde cites el artículo o fragmento específico del contexto que usaste para responder. Por ejemplo: "Fuente Legal: Artículo 5, Título II del Código Civil."
4.  Si el contexto no contiene la información necesaria para responder la pregunta, debes responder exactamente: "No tengo suficiente información en mi base de conocimiento para responder a tu pregunta."

Contexto:
{{context}}

Pregunta: {{{question}}}`,
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
    
    const queryEmbedding = embeddingResponse[0]?.embedding;
    console.log('[RAG Flow] Generated query embedding:', queryEmbedding ? `Vector of dimension ${queryEmbedding.length}` : 'null');


    if (!queryEmbedding) {
        throw new Error("Failed to generate embedding for the question.");
    }

    // 2. Search Supabase for relevant legal fragments
    console.log('[RAG Flow] Searching for documents in Supabase...');
    const { data: documents, error } = await supabase.rpc('match_lex_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
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
