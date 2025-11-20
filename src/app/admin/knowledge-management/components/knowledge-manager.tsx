
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2, Copy, Trash2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getDocumentsByDate, deleteDocumentById, deleteDocumentsByDate } from '@/app/admin/knowledge-management/actions';

type Document = {
  id: string;
  content: string;
  created_at: string;
};

// Función segura para formatear la fecha YYYY-MM-DD a DD/MM/YYYY
const formatDateForDisplay = (dateString: string) => {
  // --- DEBUGGING LOG (CLIENT) ---
  console.log('[CLIENT-SIDE] Attempting to format date:', dateString, `(Type: ${typeof dateString})`);

  if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) {
    return 'Fecha inválida';
  }
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return 'Fecha inválida';
  }
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};


export default function KnowledgeManager({ availableDates }: { availableDates: string[] }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // --- DEBUGGING LOG (CLIENT) ---
  useEffect(() => {
    console.log('[CLIENT-SIDE] Received availableDates prop:', availableDates);
  }, [availableDates]);


  const handleDateChange = (date: string) => {
    if (!date) {
      setSelectedDate(null);
      setDocuments([]);
      return;
    }
    setSelectedDate(date);
    startTransition(async () => {
      const result = await getDocumentsByDate(date);
      if (result.success) {
        setDocuments(result.data || []);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copiado', description: 'Contenido copiado al portapapeles.' });
  };

  const handleDeleteOne = (docId: string) => {
    startTransition(async () => {
      const result = await deleteDocumentById(docId);
      if (result.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
        toast({ title: 'Éxito', description: result.message });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };

  const handleDeleteAll = () => {
    if (!selectedDate) return;
    startTransition(async () => {
      const result = await deleteDocumentsByDate(selectedDate);
      if (result.success) {
        setDocuments([]);
        toast({ title: 'Éxito', description: result.message });
        // Opcional: recargar las fechas disponibles si alguna queda vacía.
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Conocimiento</CardTitle>
        <CardDescription>
          Revisa y elimina fragmentos de conocimiento por su fecha de ingreso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Select onValueChange={handleDateChange} disabled={isPending}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Selecciona una fecha..." />
            </SelectTrigger>
            <SelectContent>
              {availableDates.length > 0 ? (
                availableDates.map(date => (
                  <SelectItem key={date} value={date}>
                    {formatDateForDisplay(date)}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-dates" disabled>No hay fechas disponibles</SelectItem>
              )}
            </SelectContent>
          </Select>
          {selectedDate && documents.length > 0 && (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isPending} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Todo lo de este Día
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente 
                    todos los {documents.length} fragmentos ingresados el día {formatDateForDisplay(selectedDate!)}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll}>Sí, eliminar todo</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        <div className="min-h-[400px]">
          {isPending ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !selectedDate ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No hay fecha seleccionada</AlertTitle>
              <AlertDescription>
                Por favor, elige una fecha del menú desplegable para ver los conocimientos ingresados.
              </AlertDescription>
            </Alert>
          ) : documents.length === 0 ? (
             <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>No hay documentos</AlertTitle>
              <AlertDescription>
                No se encontraron fragmentos de conocimiento para la fecha seleccionada.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[500px] rounded-md border p-4">
              <div className="space-y-4">
                {documents.map(doc => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        {doc.content}
                      </p>
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(doc.content)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción es irreversible y eliminará el fragmento de conocimiento de la base de datos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOne(doc.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
