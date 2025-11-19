'use client';

import { useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { handleIngestion } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  lawText: z.string().min(1, 'El texto de la ley no puede estar vacío.'),
});

const initialState = {
  success: false,
  message: '',
};

export function IngestionForm() {
  const [state, formAction] = useActionState(handleIngestion, initialState);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lawText: '',
    },
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: 'Éxito', description: state.message });
        form.reset();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: state.message });
      }
    }
  }, [state, toast, form]);

  const { formState } = form;

  return (
    <Form {...form}>
      <form
        action={formAction}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="lawText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto de la Ley</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Pega aquí el texto completo de la ley..."
                  className="min-h-[300px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            'Procesar e Ingerir'
          )}
        </Button>
      </form>
    </Form>
  );
}
