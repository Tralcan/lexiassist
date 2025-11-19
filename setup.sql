-- Enable the pgvector extension to work with vector types
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for public profiles
create table lex_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  role text default 'user',
  access_expires_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table lex_profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on lex_profiles
  for select using (true);

create policy "Users can insert their own profile." on lex_profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on lex_profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up
create or replace function public.lex_handle_new_user()
returns trigger as $$
begin
  insert into public.lex_profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.lex_handle_new_user();
  
-- Create a table to store document chunks and their embeddings
create table lex_documents (
    id bigserial primary key,
    content text not null,
    embedding vector(768)
);

-- Set up Row Level Security for documents table
alter table lex_documents
    enable row level security;

-- For now, allow admins to do everything.
-- You might want to refine this later.
create policy "Admins can manage documents" on lex_documents
    for all using (
        (select role from lex_profiles where id = auth.uid()) = 'admin'
    );

-- Allow authenticated users to read documents.
-- This is necessary for the RAG functionality.
create policy "Authenticated users can view documents" on lex_documents
    for select using ( auth.role() = 'authenticated' );
