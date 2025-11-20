
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2, Copy, Trash2, ShieldAlert, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { 
  getAvailableDates,
  getDocumentsByDate,
  deleteDocumentById,
  deleteDocumentsByDate,
  updateDocumentContent,
  type Document
} from './actions';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const formatDateForDisplay = (dateString: string): string => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return 'Fecha inválida';
  }
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function KnowledgeManagementPage() {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    startTransition(async () => {
        const result = await getAvailableDates();
        if (result.success && result.data) {
            setAvailableDates(result.data.filter(Boolean));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las fechas disponibles.' });
        }
    });
  }, [toast]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (!date) {
      setDocuments([]);
      return;
    }
    
    startTransition(async () => {
      const result = await getDocumentsByDate(date);
      if (result.success && result.data) {
        setDocuments(result.data);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
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
        toast({ variant: 'destructive', title: 'Error', description: result.message });
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
        const updatedDates = availableDates.filter(d => d !== selectedDate);
        setAvailableDates(updatedDates);
        setSelectedDate('');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleEditClick = (doc: Document) => {
    setEditingDoc(doc);
    setEditText(doc.content);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingDoc || editText.trim() === '') return;
    startTransition(async () => {
      const result = await updateDocumentContent(editingDoc.id, editText);
      if (result.success) {
        setDocuments(prev => prev.map(doc => doc.id === editingDoc.id ? { ...doc, content: editText } : doc));
        toast({ title: 'Éxito', description: result.message });
        setIsEditDialogOpen(false);
        setEditingDoc(null);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Conocimiento</CardTitle>
          <CardDescription>Revisa, edita y elimina fragmentos de conocimiento por su fecha de ingreso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Select onValueChange={handleDateChange} value={selectedDate} disabled={isPending}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Selecciona una fecha..." />
              </SelectTrigger>
              <SelectContent>
                {availableDates.length > 0 ? (
                  availableDates.filter(Boolean).map(date => (
                    <SelectItem key={date} value={date}>
                      {formatDateForDisplay(date)}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">No hay fechas disponibles</div>
                )}
              </SelectContent>
            </Select>
            {selectedDate && documents.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isPending} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Todo ({documents.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente los {documents.length} fragmentos del día {formatDateForDisplay(selectedDate)}. No se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90">Sí, eliminar todo</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <div className="min-h-[400px] relative">
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {!selectedDate && !isPending ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Selecciona una Fecha</AlertTitle>
                <AlertDescription>Elige una fecha para ver los conocimientos ingresados ese día.</AlertDescription>
              </Alert>
            ) : !isPending && documents.length === 0 ? (
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Sin Documentos</AlertTitle>
                <AlertDescription>No se encontraron fragmentos para la fecha seleccionada.</AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-[500px] rounded-md border">
                <div className="p-4 space-y-4">
                  {documents.map(doc => (
                    <Card key={doc.id}>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">{doc.content}</p>
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(doc)} aria-label="Editar contenido">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleCopy(doc.content)} aria-label="Copiar contenido">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Eliminar fragmento">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción es irreversible y eliminará el fragmento.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteOne(doc.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Fragmento</DialogTitle>
            <DialogDescription>
              Realiza los cambios necesarios en el contenido del fragmento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 items-center gap-4">
              <Label htmlFor="content" className="sr-only">
                Contenido
              </Label>
              <Textarea
                id="content"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="col-span-3 min-h-[250px]"
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
