# Custom Portfolio

## Supabase & Deployment Quickstart
1. **Create a Supabase project** – In the Supabase dashboard, create a new project. Copy the project URL and anon key for later.
2. **Run the SQL migration** – Open the SQL editor in Supabase and paste the contents of `supabase.sql`. Execute it once to create the tables, apply RLS policies, add the required columns, and seed the site with the original Aria Lumen content.
3. **Configure Storage** – In Supabase Storage, create a bucket named `images` and set it to public read access. Keep the default policy so authenticated users can upload via the dashboard.
4. **Create environment variables** – Duplicate `.env.example` and provide your Supabase URL and anon key. In local development you can copy the values into `js/env.js` (or set them through your hosting platform’s environment injection).
5. **Create the admin user** – In Supabase Auth → Users, add the email/password account that will manage uploads from `/admin`.
6. **Serve the site** – Host the repository on a static platform (Vercel, Netlify, etc.). Make sure `js/env.js` is served or that you inject `window.env.SUPABASE_URL` and `window.env.SUPABASE_ANON_KEY` at runtime.
7. **Submit images** – Visit `/admin`, sign in with the admin account, and use the single submission form to add new imagery. Public pages immediately consume content from the database and Supabase Storage.

## Development
- Public pages (`index.html`, `about.html`, `portfolio.html`, `contact.html`) preserve the original layout and copy. JavaScript fetches all dynamic content from Supabase so future updates require no code edits.
- `/admin` provides a gated upload form for adding new images to any of the canonical pages. There are no edit/delete controls to keep the workflow limited to submissions only.
- Static assets use vanilla HTML, CSS, and JS. No build tooling is required; a simple static server is enough for local testing.
