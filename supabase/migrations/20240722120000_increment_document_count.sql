
-- Add a 'count' column to lex_documents if it doesn't exist
alter table public.lex_documents add column if not exists count integer default 0 not null;

-- Create the RPC function to increment the count
create or replace function public.increment_lex_document_count(doc_id uuid)
returns void
language sql
as $$
  update public.lex_documents
  set count = count + 1
  where id = doc_id;
$$;

