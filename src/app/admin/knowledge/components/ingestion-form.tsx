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
  lawText: z.string().min(1, 'Law text cannot be empty.'),
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
