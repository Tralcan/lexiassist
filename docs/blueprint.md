# **App Name**: LexiAssist

## Core Features:

- User Management: Admin interface for creating new users with login/email, initial password, and access expiration date. Utilizes Supabase Auth.
- User Management: Functionality for managing existing users (edit name, disable, and force password changes) within the Supabase Auth system.
- Knowledge Ingestion: Upload or paste Chilean law text via admin interface. This triggers backend logic to chunk the text, generate embeddings using the Gemini API, and store the text and vector in Supabase/pgvector.
- Login/Access: Login page using Supabase Auth system for user authentication before accessing legal consultation features.
- Chat Interface: Simple chat interface where users can input their questions. Accessible only after login.
- Legal Consultation via RAG: Processes user questions by vectorizing the question, searching Supabase/pgvector for relevant legal fragments, and sending a prompt with context to the Gemini API for the final answer.

## Style Guidelines:

- Primary color: Deep indigo (#4B0082) to convey trust and intelligence.
- Background color: Light grey (#F0F0F0), nearly white, for a clean and professional feel.
- Accent color: Muted gold (#B8860B) to highlight key elements and CTAs with sophistication.
- Body and headline font: 'Inter', a sans-serif font with a modern, objective look, suitable for both headlines and body text. 
- Use crisp, professional icons related to legal topics (e.g., scales of justice, gavel, law books).
- Clean, organized layout with clear section divisions to enhance usability.
- Subtle animations (e.g., loading spinners, transition effects) to provide feedback and a polished user experience.