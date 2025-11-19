'use server';

/**
 * @fileOverview This file defines a Genkit flow for ingesting knowledge,
 * chunking it, generating embeddings using the Gemini API, and storing the
 * text and vector in Supabase/pgvector.
 *
 * - knowledgeIngestionEmbedding - A function that handles the knowledge ingestion process.
 * - KnowledgeIngestionEmbeddingInput - The input type for the knowledgeIngestionEmbedding function.
 * - KnowledgeIngestionEmbeddingOutput - The return type for the knowledgeIngestionEmbedding function.
 */

import {ai} from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/admin';
import {z} from 'genkit';

const KnowledgeIngestionEmbeddingInputSchema = z.object({
  lawText: z.string().describe('The text of the Chilean law to be ingested.'),
});
export type KnowledgeIngestionEmbeddingInput = z.infer<
  typeof KnowledgeIngestionEmbeddingInputSchema
>;

const KnowledgeIngestionEmbeddingOutputSchema = z.object({
  success: z.boolean().describe('Whether the knowledge ingestion was successful.'),
  message: z.string().describe('A message indicating the status of the ingestion.'),
});
export type KnowledgeIngestionEmbeddingOutput = z.infer<
  typeof KnowledgeIngestionEmbeddingOutputSchema
>;

export async function knowledgeIngestionEmbedding(
  input: KnowledgeIngestionEmbeddingInput
): Promise<KnowledgeIngestionEmbeddingOutput> {
  return knowledgeIngestionEmbeddingFlow(input);
}

const knowledgeIngestionEmbeddingFlow = ai.defineFlow(
  {
    name: 'knowledgeIngestionEmbeddingFlow',
    inputSchema: KnowledgeIngestionEmbeddingInputSchema,
    outputSchema: KnowledgeIngestionEmbeddingOutputSchema,
  },
  async input => {
    try {
      const supabase = createAdminClient();
      
      const chunks = input.lawText.split('\n').filter(chunk => chunk.trim().length > 10);
      if (chunks.length === 0) {
        return { success: false, message: 'No text chunks to process. Ensure the text has paragraphs.' };
      }
      
      let processedCount = 0;
      for (const chunk of chunks) {
        const embedding = await ai.embed({
          embedder: 'googleai/text-embedding-004',
          content: chunk,
        });

        const { error } = await supabase.from('lex_documents').insert({
          content: chunk,
          embedding: embedding,
        });

        if (error) {
          // If one fails, we stop and report the error.
          throw new Error(`Supabase error on chunk "${chunk.substring(0, 20)}...": ${error.message}`);
        }
        processedCount++;
      }

      return {
        success: true,
        message: `Successfully ingested and embedded ${processedCount} document chunks.`,
      };

    } catch (error: any) {
        console.error("Error in knowledge ingestion flow:", error);
        return {
            success: false,
            message: error.message || "An unknown error occurred during ingestion."
        }
    }
  }
);
