import { IngestionForm } from './components/ingestion-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function KnowledgePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingesta de Conocimiento</CardTitle>
        <CardDescription>
          Sube o pega el texto de la ley chilena relevante. El sistema
          segmentará el texto, generará incrustaciones (embeddings) y lo almacenará para su consulta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <IngestionForm />
      </CardContent>
    </Card>
  );
}
