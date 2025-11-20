
create function increment_lex_document_count(doc_id uuid)
returns void
language plpgsql
as $$
begin
  update lex_documents
  set count = count + 1
  where id = doc_id;
end;
$$;
