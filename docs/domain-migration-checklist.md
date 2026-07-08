# Domain Migration Checklist

This app is moving public production branding from `train.hapticvets.com` to `app.patriotk9kennel.com`.

## Before cutover

1. Vercel
   - Add `app.patriotk9kennel.com` to this project.
   - Keep `train.hapticvets.com` attached during testing so both domains work in parallel.

2. GoDaddy
   - Add the DNS record that Vercel provides for `app.patriotk9kennel.com`.
   - Wait for DNS propagation before validating auth or checkout flows.

3. Clerk
   - Add `app.patriotk9kennel.com` to allowed origins.
   - Add `app.patriotk9kennel.com` to redirect URLs for sign-in and sign-up flows.
   - Keep the existing `train.hapticvets.com` entries active during migration testing.

4. Google OAuth
   - If Google OAuth is enabled in Clerk or directly in Google Cloud, add the new authorized domain.
   - Add any new callback or redirect URIs needed for `app.patriotk9kennel.com`.

5. Stripe Checkout
   - Confirm the deployed app resolves `NEXT_PUBLIC_APP_URL` to `https://app.patriotk9kennel.com`.
   - Validate checkout success and cancel routes on the new domain.

6. Stripe Customer Portal
   - Confirm the billing portal return URL resolves back to `https://app.patriotk9kennel.com/dashboard`.

7. Google Ads
   - Keep existing ads pointing at the old domain until the new domain is fully validated.
   - Update final URLs to `https://app.patriotk9kennel.com` after testing.
   - Validate that the purchase conversion still fires on the new domain.

8. Google Search Console
   - Add a property for `app.patriotk9kennel.com`.
   - Submit the new sitemap after deployment.

9. Google Analytics
   - Verify pageview and conversion tracking on the new domain.
   - Confirm cross-domain or referral exclusion settings if required.

10. SEO checks
    - Confirm `robots.txt` resolves on the new domain.
    - Confirm `sitemap.xml` resolves on the new domain.
    - Confirm canonical and Open Graph URLs point to `app.patriotk9kennel.com`.

## After validation

1. Redirect plan
   - Configure 301 redirects from `train.hapticvets.com` to matching routes on `app.patriotk9kennel.com`.
   - Keep the old domain available until redirects and analytics are confirmed stable.

2. Post-cutover verification
   - Test sign-in, sign-up, checkout, billing portal, dashboard, and trainer flows on the new domain.
   - Re-check Google Ads purchase conversion after live traffic reaches the new domain.
