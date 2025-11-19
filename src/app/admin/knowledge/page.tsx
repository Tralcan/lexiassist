import { IngestionForm } from './components/ingestion-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function KnowledgePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Ingestion</CardTitle>
        <CardDescription>
          Upload or paste the text of the relevant Chilean law. The system will
          segment the text, generate embeddings, and store it for consultation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <IngestionForm />
      </CardContent>
    </Card>
  );
}
