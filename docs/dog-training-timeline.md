# Dog Training Timeline

Apply `supabase/migrations/20260721_add_dog_timeline_events.sql` through the Supabase SQL editor or the project's migration workflow before deploying this feature.

The Timeline uses `dog_timeline_events` for durable, idempotent training-record events. Existing profiles and session logs are backfilled lazily the first time an authenticated owner opens that dog's Timeline. The backfill is safe to repeat because each automatic event has a unique source/event index.

Timeline access is server-mediated. The application checks the current Clerk user owns the requested `dog_profiles` row before reading, backfilling, or creating timeline records. RLS is enabled with no browser-facing policies because no direct browser Supabase access is used.
