'use client';

import { useState } from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { UserForm } from './user-form';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { forcePasswordChange, disableUser } from '../actions';
import { useToast } from '@/hooks/use-toast';

type UserWithProfile = User & { profile: Profile | null };

export default function UserTableClient({ users: initialUsers }: { users: UserWithProfile[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const { toast } = useToast();

  const handleUserCreated = (newUser: UserWithProfile) => {
    setUsers([...users, newUser]);
  };
  
  const handleUserUpdated = (updatedUser: UserWithProfile) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  
  const handleEdit = (user: UserWithProfile) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };
  
  const handleForcePasswordChange = async (email: string) => {
     const result = await forcePasswordChange(email);
     if(result.success) {
        toast({ title: "Éxito", description: result.message });
     } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
     }
  }

  const handleDisableUser = async (userId: string, currentStatus: boolean) => {
    const result = await disableUser(userId, currentStatus);
    if(result.success) {
      toast({ title: "Éxito", description: result.message });
      // Actualización optimista de la UI
      setUsers(users.map(u => u.id === userId ? {...u, raw_user_meta_data: {...u.raw_user_meta_data, disabled: !currentStatus}} : u));
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
  }

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>Gestiona tus usuarios y sus accesos.</CardDescription>
            </div>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" onClick={handleCreate}>
                <PlusCircle className="h-4 w-4" />
                Añadir Usuario
              </Button>
            </DialogTrigger>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acceso Expira</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.profile?.full_name || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>{user.profile?.role || 'user'}</TableCell>
                   <TableCell>
                    <Badge variant={user.raw_user_meta_data?.disabled ? "secondary" : "default"}>
                        {user.raw_user_meta_data?.disabled ? 'Deshabilitado' : 'Activo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.profile?.access_expires_at ? format(new Date(user.profile.access_expires_at), 'PPP') : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Alternar menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDisableUser(user.id, !!user.raw_user_meta_data?.disabled)}>
                            {user.raw_user_meta_data?.disabled ? "Habilitar" : "Deshabilitar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleForcePasswordChange(user.email!)}>Forzar Cambio de Contraseña</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <UserForm 
        user={selectedUser} 
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
        setOpen={setIsFormOpen}
      />
    </Dialog>
  );
}
