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

const formSchema = z.object({
  lawText: z.string().min(50, 'Law text must be at least 50 characters long.'),
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
        toast({ title: 'Success', description: state.message });
        form.reset();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: state.message });
      }
    }
  }, [state, toast, form]);

  const { formState, handleSubmit } = form;

  return (
    <Form {...form}>
      <form
        action={formAction}
        onSubmit={handleSubmit(() => {
          // We still need handleSubmit for client-side validation
          // but the action will be triggered by the form's action prop.
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="lawText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Law Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Paste the full text of the law here..."
                  className="min-h-[300px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Processing...' : 'Process and Ingest'}
        </Button>
      </form>
    </Form>
  );
}
