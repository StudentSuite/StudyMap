# Supabase setup (optional)

Sign-in and private pins are the only features that need a backend. Skip this
whole folder and the app still runs: the map, resources, papers, and benefits
all work with no keys.

## Enable sign-in and private pins

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `migrations/0001_personal_pins.sql` (SQL Editor, or
   `supabase db push` if you use the CLI). It creates the `personal_pins` table
   with row level security so each user sees only their own pins.
3. In Authentication, Providers, enable Google and add your Google Cloud OAuth
   client ID and secret.
4. Set the redirect URL to `<your-site-url>/auth/callback` (for local work that
   is `http://localhost:3000/auth/callback`).
5. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`
   and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings, API.
6. Restart the dev server. The Account page now offers Google sign-in and your
   saved places show on a private map layer.
