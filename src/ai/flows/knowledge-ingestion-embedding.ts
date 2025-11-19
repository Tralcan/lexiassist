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
      
      const lines = input.lawText.split('\n').filter(line => line.trim().length > 0);
      if (lines.length === 0) {
        return { success: false, message: 'El texto de la ley está vacío o no tiene contenido.' };
      }
      
      const chunks: string[] = [];
      let currentHeader = '';

      for (const line of lines) {
        // Heurística simple: si una línea es corta y no empieza como un artículo, es un título.
        // Se puede mejorar con expresiones regulares más complejas si es necesario.
        if (line.length < 100 && !line.trim().toLowerCase().startsWith('artículo')) {
            currentHeader = line.trim();
            // También añadimos el propio título como un chunk, por si es relevante.
            chunks.push(currentHeader);
        } else {
            // Si es un artículo, lo prefijamos con el último encabezado que encontramos.
            const chunkContent = currentHeader ? `${currentHeader} - ${line.trim()}` : line.trim();
            chunks.push(chunkContent);
        }
      }

      if (chunks.length === 0) {
        return { success: false, message: 'No se generaron fragmentos procesables. Asegúrate de que el texto esté bien formateado.' };
      }
      
      let processedCount = 0;
      for (const chunk of chunks) {
         if (chunk.trim().length < 20) continue; // Omitir chunks muy cortos

        const embeddingResponse = await ai.embed({
          embedder: 'googleai/text-embedding-004',
          content: chunk,
        });
        
        const vector = embeddingResponse[0]?.embedding;

        if (!vector) {
            console.warn(`No se pudo generar embedding para el fragmento: "${chunk.substring(0, 30)}..."`);
            continue; // Saltar este chunk y continuar con el siguiente
        }

        const { error } = await supabase.from('lex_documents').insert({
          content: chunk,
          embedding: vector,
        });

        if (error) {
          throw new Error(`Error en Supabase en el fragmento "${chunk.substring(0, 30)}...": ${error.message}`);
        }
        processedCount++;
      }

      if (processedCount === 0) {
          return { success: false, message: 'Aunque se procesó el texto, no se pudieron ingerir fragmentos válidos. Revisa el formato y contenido.' };
      }

      return {
        success: true,
        message: `Se ingirieron y procesaron exitosamente ${processedCount} fragmentos de documentos.`,
      };

    } catch (error: any) {
        console.error("Error en el flujo de ingesta de conocimiento:", error);
        return {
            success: false,
            message: error.message || "Ocurrió un error desconocido durante la ingesta."
        }
    }
  }
);
