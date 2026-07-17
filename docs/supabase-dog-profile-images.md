# Dog Profile Image Storage Setup

Apply `supabase/migrations/20260716_add_dog_profile_images.sql` through the Supabase SQL editor or the project migration workflow before deploying photo uploads.

The migration adds `dog_profiles.profile_image_path` and creates the private `dog-profile-images` bucket. Do not create public read policies for this bucket. The application uses the Supabase service-role client only in authenticated server routes, after matching the requested dog profile to the current Clerk user.

Files are stored as `{clerkUserId}/{dogProfileId}/{generatedFilename}`. The browser receives one-hour signed URLs only after the server verifies ownership. Ensure `SUPABASE_SERVICE_ROLE_KEY` remains server-only and that the existing `NEXT_PUBLIC_SUPABASE_URL` matches the configured Supabase project.
