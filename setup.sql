-- setup.sql

-- 1. Habilitar la extensión pgvector
-- Esta extensión es necesaria para trabajar con embeddings y búsqueda de similitud.
create extension if not exists vector with schema extensions;

-- 2. Crear la tabla de perfiles de usuario (lex_profiles)
-- Esta tabla almacenará información adicional para los usuarios autenticados.
create table public.lex_profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  email text,
  role text default 'user',
  access_expires_at timestamp with time zone
);

-- 3. Crear la tabla de documentos para el conocimiento (lex_documents)
-- Esta tabla almacenará los fragmentos de texto y sus embeddings correspondientes.
create table public.lex_documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(768) -- El modelo de embedding de Gemini suele usar 768 dimensiones.
);

-- 4. Crear una función para búsqueda de similitud
-- Esta función buscará en lex_documents y devolverá los fragmentos más relevantes.
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    lex_documents.id,
    lex_documents.content,
    lex_documents.metadata,
    1 - (lex_documents.embedding <=> query_embedding) as similarity
  from lex_documents
  where 1 - (lex_documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- 5. Configurar Políticas de Seguridad a Nivel de Fila (RLS)

-- Habilitar RLS en la tabla de perfiles
alter table public.lex_profiles enable row level security;

-- Los usuarios pueden ver su propio perfil.
create policy "Users can view their own profile."
on public.lex_profiles for select
using ( auth.uid() = id );

-- Los usuarios pueden actualizar su propio perfil.
create policy "Users can update their own profile."
on public.lex_profiles for update
using ( auth.uid() = id );

-- Los administradores tienen acceso completo a los perfiles.
create policy "Admins have full access to profiles."
on public.lex_profiles for all
using ( (select auth.uid() from public.lex_profiles where id = auth.uid() and role = 'admin') is not null );


-- Habilitar RLS en la tabla de documentos
alter table public.lex_documents enable row level security;

-- Cualquier usuario autenticado puede leer los documentos.
create policy "Authenticated users can read documents."
on public.lex_documents for select
using ( auth.role() = 'authenticated' );

-- Solo los administradores pueden crear, actualizar o eliminar documentos.
create policy "Admins can manage documents."
on public.lex_documents for all
using ( (select auth.uid() from public.lex_profiles where id = auth.uid() and role = 'admin') is not null );

-- 6. Función para crear perfiles de usuario automáticamente
-- Esta función se dispara cuando se crea un nuevo usuario en auth.users.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.lex_profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

-- 7. Trigger para la función de creación de perfiles
-- Asocia la función handle_new_user al evento de inserción en auth.users.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fin del script --
