'use client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { createUser, updateUser } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UserWithProfile = User & { profile: Profile | null };

const formSchema = z.object({
  fullName: z.string().min(2, 'El nombre completo debe tener al menos 2 caracteres.'),
  email: z.string().email('Email inválido.'),
  password: z.string().optional(),
  accessExpiresAt: z.date().optional(),
  role: z.enum(['admin', 'user']),
}).refine(data => {
    // Si es un nuevo usuario (sin id), la contraseña es obligatoria
    return !data.password || data.password.length >= 6;
}, {
    message: "La contraseña debe tener al menos 6 caracteres.",
    path: ["password"],
});

type UserFormProps = {
  user: UserWithProfile | null;
  onUserCreated: (user: any) => void;
  onUserUpdated: (user: any) => void;
  setOpen: (open: boolean) => void;
};

export function UserForm({ user, onUserCreated, onUserUpdated, setOpen }: UserFormProps) {
  const { toast } = useToast();
  const isEditMode = !!user;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.profile?.full_name || '',
      email: user?.email || '',
      password: '',
      accessExpiresAt: user?.profile?.access_expires_at ? new Date(user.profile.access_expires_at) : undefined,
      role: user?.profile?.role || 'user',
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = isEditMode 
      ? await updateUser(user.id, values) 
      : await createUser(values);

    if (result.success) {
        toast({ title: 'Éxito', description: `Usuario ${isEditMode ? 'actualizado' : 'creado'} correctamente.` });
        if(isEditMode) {
            onUserUpdated(result.user!);
        } else {
            onUserCreated(result.user!);
        }
        setOpen(false);
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
        <DialogDescription>
          {isEditMode ? "Actualiza los detalles del usuario." : 'Completa los detalles para crear un nuevo usuario.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} disabled={isEditMode} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!isEditMode && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="user">Usuario</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accessExpiresAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expiración de Acceso</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Elige una fecha</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Usuario'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
