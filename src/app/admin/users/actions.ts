
'use server';
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const userSchema = z.object({
  fullName: z.string().min(2, 'El nombre completo debe tener al menos 2 caracteres.'),
  email: z.string().email(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').optional(),
  accessExpiresAt: z.date().optional(),
  role: z.enum(['admin', 'user']),
});

export async function createUser(data: z.infer<typeof userSchema>) {
  const validation = userSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }
  
  if (!data.password) {
      return { success: false, message: 'La contraseña es obligatoria para nuevos usuarios.' };
  }

  const supabaseAdmin = createAdminClient();
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // Auto-confirmar usuario
  });

  if (authError) {
    return { success: false, message: authError.message };
  }
  
  const user = authData.user;
  
  if (!user) {
    return { success: false, message: "No se pudo crear el usuario." };
  }

  // En lugar de INSERT, hacemos un UPDATE.
  // Suponemos que un trigger en la base de datos ya creó un perfil básico.
  const { error: profileError } = await supabaseAdmin
    .from('lex_profiles')
    .update({
      full_name: data.fullName,
      email: data.email,
      access_expires_at: data.accessExpiresAt?.toISOString(),
      role: data.role,
    })
    .eq('id', user.id);


  if (profileError) {
    // Si la actualización del perfil falla, eliminamos el usuario de auth para mantener la consistencia.
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return { success: false, message: `Error al actualizar el perfil: ${profileError.message}` };
  }

  // Obtenemos el perfil actualizado para devolverlo
  const {data: profile} = await supabaseAdmin.from('lex_profiles').select('*').eq('id', user.id).single();
  
  revalidatePath('/admin/users');
  return { success: true, message: 'Usuario creado con éxito.', user: {...user, profile } };
}

export async function updateUser(userId: string, data: Partial<z.infer<typeof userSchema>>) {
  const supabaseAdmin = createAdminClient();

  const { error: profileError } = await supabaseAdmin
    .from('lex_profiles')
    .update({
      full_name: data.fullName,
      access_expires_at: data.accessExpiresAt?.toISOString(),
      role: data.role,
    })
    .eq('id', userId);

  if (profileError) {
    return { success: false, message: profileError.message };
  }
  
  const {data: updatedUser, error: userError} = await supabaseAdmin.auth.admin.getUserById(userId);
  if(userError) return { success: false, message: userError.message };

  const {data: profile} = await supabaseAdmin.from('lex_profiles').select('*').eq('id', userId).single();


  revalidatePath('/admin/users');
  return { success: true, message: 'Usuario actualizado con éxito.', user: {...updatedUser.user, profile }};
}

export async function forcePasswordChange(email: string) {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email);
    if(error) {
        return { success: false, message: error.message };
    }
    return { success: true, message: `Enlace para restablecer contraseña enviado a ${email}.` };
}

export async function disableUser(userId: string, currentStatus: boolean) {
    const supabaseAdmin = createAdminClient();
    const newStatus = !currentStatus;

    // Aquí estamos actualizando los metadatos del usuario en `auth.users`.
    // La columna 'disabled' no es estándar en `auth.users`, sino en los metadatos.
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { disabled: newStatus }
    });

    if (error) {
        return { success: false, message: error.message };
    }
    
    revalidatePath('/admin/users');
    return { success: true, message: `Usuario ${newStatus ? 'deshabilitado' : 'habilitado'} correctamente.` };
}

