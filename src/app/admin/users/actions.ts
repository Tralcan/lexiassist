'use server';

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const userSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional(),
  accessExpiresAt: z.date().optional(),
  role: z.enum(['admin', 'user']),
});

export async function createUser(data: z.infer<typeof userSchema>) {
  const validation = userSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }
  
  if (!data.password) {
      return { success: false, message: 'Password is required for new users.' };
  }

  const supabaseAdmin = createAdminClient();
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // Auto-confirm user
  });

  if (authError) {
    return { success: false, message: authError.message };
  }
  
  const user = authData.user;
  
  if (!user) {
    return { success: false, message: "Could not create user." };
  }

  const { error: profileError } = await supabaseAdmin.from('lex_profiles').insert({
    id: user.id,
    full_name: data.fullName,
    email: data.email,
    access_expires_at: data.accessExpiresAt?.toISOString(),
    role: data.role,
  });

  if (profileError) {
    // If profile creation fails, we should probably delete the auth user
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return { success: false, message: profileError.message };
  }
  
  revalidatePath('/admin/users');
  return { success: true, message: 'User created successfully.', user: {...user, profile: data} };
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
  return { success: true, message: 'User updated successfully.', user: {...updatedUser.user, profile }};
}

export async function forcePasswordChange(email: string) {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email);
    if(error) {
        return { success: false, message: error.message };
    }
    return { success: true, message: `Password reset link sent to ${email}.` };
}

export async function disableUser(userId: string, currentStatus: boolean) {
    const supabaseAdmin = createAdminClient();
    const newStatus = !currentStatus;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { disabled: newStatus }
    });

    if (error) {
        return { success: false, message: error.message };
    }
    
    revalidatePath('/admin/users');
    return { success: true, message: `User successfully ${newStatus ? 'disabled' : 'enabled'}.` };
}
