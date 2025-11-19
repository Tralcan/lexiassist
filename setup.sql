-- Drop existing tables and functions if they exist to avoid conflicts
-- This is useful for development to start with a clean slate.
DROP TABLE IF EXISTS public.lex_documents CASCADE;
DROP TABLE IF EXISTS public.lex_profiles CASCADE;
DROP FUNCTION IF EXISTS public.lex_handle_new_user();

-- Create profiles table
CREATE TABLE public.lex_profiles (
  id uuid NOT NULL PRIMARY KEY,
  full_name text,
  email text,
  role text,
  access_expires_at timestamp with time zone,
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);
COMMENT ON TABLE public.lex_profiles IS 'Stores user profile information.';

-- Create documents table
CREATE TABLE public.lex_documents (
  id bigserial PRIMARY KEY,
  content text,
  embedding vector(768)
);
COMMENT ON TABLE public.lex_documents IS 'Stores ingested legal documents and their embeddings.';


-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.lex_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lex_profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.lex_handle_new_user IS 'Creates a profile for a new user.';

-- Create a trigger to call the function after a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.lex_handle_new_user();
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'When a user is created, this trigger fires the lex_handle_new_user function to create a corresponding profile.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.lex_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lex_documents ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Users can view their own profile." ON public.lex_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON public.lex_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles." ON public.lex_profiles
  FOR ALL USING ((SELECT role FROM public.lex_profiles WHERE id = auth.uid()) = 'admin');


-- Policies for documents table
CREATE POLICY "Admins can manage documents." ON public.lex_documents
  FOR ALL USING ((SELECT role FROM public.lex_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Authenticated users can read documents." ON public.lex_documents
  FOR SELECT USING (auth.role() = 'authenticated');


-- Grant usage on the schema to the necessary roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions for the tables
GRANT ALL ON TABLE public.lex_profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lex_profiles TO authenticated;

GRANT ALL ON TABLE public.lex_documents TO postgres, service_role;
GRANT SELECT ON TABLE public.lex_documents TO authenticated;

-- Grant permissions for sequences (if you have bigserial columns)
GRANT USAGE, SELECT ON SEQUENCE public.lex_documents_id_seq TO postgres, service_role, authenticated;
