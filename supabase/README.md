# Supabase Project Setup

1. **Install & Log In**
   ```sh
   npm install -g supabase
   supabase login
   ```

2. **Initialize & Link**
   ```sh
   supabase init
   supabase link --project-ref <your-project-ref>
   ```

3. **Apply Database Schema**
   - Place SQL files inside `supabase/migrations/`.
   - Run `supabase db push` to sync schema from `docs/context.md`.

4. **Local Development**
   ```sh
   supabase start    # Launches local stack
   supabase status   # Checks health
   supabase stop     # Shutdown
   ```

5. **Environment Variables**
   - Keep credentials in `.env` (already gitignored).
   - Expose the following to the app through Expo config:
     - `EXPO_PUBLIC_SUPABASE_URL`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

6. **Deployment Checklist**
   - Run migrations via CI/CD before publishing a new mobile build.
   - Rotate service role keys periodically.
   - Monitor Supabase logs for RLS denials and slow queries.

