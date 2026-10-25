# Private training appointments

Owner page: https://app.patriotk9kennel.com/admin/bookings (existing administrator sign-in).
Customer page: https://www.patriotk9kennel.com/inquire?service=Private%20training

1. Offer specific days and start times in the admin page. Each appointment is 60 minutes, in Eastern time. No weekly hours or appointments are published automatically.
2. A customer chooses Private training and an offered time, provides an email, and submits the verified inquiry form.
3. The request is saved as pending and John receives an email linking to the booking page. Pending requests do not reserve a time.
4. Approve one request to reserve the time and send the customer a confirmation. The time disappears from the public form. A second approval for that time is rejected by the database.
5. Decline sends a message asking the customer to arrange another time. Cancel an approved appointment to free its time. Remove that offered time afterwards if it should stay closed.

Boarding and other service inquiries keep their existing separate email flow. No payments, weekly recurrences, text notifications, Google Calendar sync, or spreadsheet sync are introduced.

## Deployment

Apply `supabase/migrations/202610250001_booking.sql` to the existing **Patriot K9 Command** project (`wllraartakmivgqcybxe`). The public website's existing database is a different project: preserve it.

Both websites use the same server-only `lib/bookings.ts` implementation (public copy under `src/lib`). The public website needs `BOOKING_SUPABASE_URL` and `BOOKING_SUPABASE_SERVICE_ROLE_KEY` pointing to the admin database; these override only booking access. The admin uses its existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Both already have production Resend configuration. Never put service-role keys in a client component or public environment variable.

Tables enable RLS and deny anon/authenticated access. Server code reads with service role. Admin reads and writes require the existing Clerk admin role; writes also verify Origin. All appointment changes share an advisory transaction lock. Overlapping open slots and multiple approvals for a slot also have database constraints. Booking submissions have unique retry IDs.

Email outbox entries persist separately from appointment decisions. A delivery timeout leaves a two-minute lease; the admin page shows Retry email. Retries reuse a Resend idempotency key. Do not change an appointment while its email is being delivered; retry after the lease expires. Check pending requests in admin even if email is delayed. Outbox retries are manual in this first version. Resend's idempotency window is 24 hours; inspect delivery status before retrying an uncertain send after that window.

The admin page shows the most recent 1,000 requests and up to 500 future slots. Add pagination before this volume is exceeded.

## Verification

`node --test tests/bookings.mjs` in admin; `node --test tests/bookings.mjs tests/training-inquiry.mjs` in public. Run `tests/bookings.sql` inside a rollback transaction after the schema is available. It checks conflicting slots, double approval, stale requests, cancellation/reopening, idempotency, mail leases, and anonymous access restrictions. Production builds and targeted ESLint also pass. Local worktree dependency junctions require `next build --webpack`; Vercel installs regular dependencies and can use its default build.
