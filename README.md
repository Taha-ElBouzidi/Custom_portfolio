# Custom Portfolio

## Setup & Deployment
1. **Create a Supabase project** – In the Supabase dashboard, provision a new project and copy the project URL plus anon key.
2. **Apply the SQL migration** – Open the SQL editor and run the contents of `supabase.sql`. This creates the schema, enables Row Level Security, seeds the original Mehdii El Marouazi content, and configures Storage policies for the `images` bucket.
3. **Configure Storage** – In Supabase Storage, create a bucket named `images`, mark it as public for reads, and keep authenticated writes enabled so the admin dashboard can upload, replace, and delete files.
4. **Provide environment variables** – Duplicate `.env.example` (or inject environment variables in your hosting platform) so the frontend can read `SUPABASE_URL` and `SUPABASE_ANON_KEY`. During local development you can populate `js/env.js` with the same keys.
5. **Create the admin user** – From Supabase Auth → Users, add the email/password account that will manage uploads. The `/admin` route uses Supabase Auth to gate access and persists the session.
6. **Deploy the static site** – Serve the repository from a static host (Vercel, Netlify, etc.). The public pages remain at the root (`index.html`, `about.html`, `portfolio.html`, `contact.html`) and the dashboard stays at `/admin` without public navigation links.

## Development Notes
- Public pages preserve the original Mehdii El Marouazi markup, typography, and copy while loading navigation, hero content, galleries, and contact details directly from Supabase.
- Portfolio filtering continues to support the original categories and now exposes tag filtering sourced from the `images` table.
- The `/admin` dashboard offers authenticated image management with filters, search, pagination, file uploads to Supabase Storage, URL validation, full metadata editing, activation toggles, and hard deletes.
- All data reads remain public under RLS, while writes require an authenticated Supabase session.
