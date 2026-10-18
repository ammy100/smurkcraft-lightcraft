# Smurkcraft Connect — configuration

The browser build reads the Supabase project URL and **publishable** client key from `apps/smurkcraft-web/connect.js`. Publishable/anon keys are designed to be exposed in browser clients; never put a Supabase service-role key in client code.

## Authentication
- Email/password uses Supabase Auth.
- Google sign-in requires Google OAuth credentials to be configured in Supabase Dashboard → Authentication → Providers → Google.
- Add the deployed Smurkcraft web URL and local development URL to Supabase Authentication → URL Configuration → Redirect URLs.
- If email confirmation is enabled, new users must confirm their email before signing in.

## Connect features
- Direct creator-to-creator messages use `connect_profiles`, `connect_conversations`, `connect_conversation_members` and `connect_messages`.
- Product announcements use `connect_announcements`. Only authenticated users with `app_metadata.role = admin` may publish announcements under the database policy.
- Smurk AI currently provides lightweight local creative guidance. It does not make network AI calls or automatically change photo adjustments.
- Original photos and the photo library are not uploaded by this feature. Message attachments are not yet enabled.

## Usernames
New accounts receive a display name, but should set a unique username in their profile before other creators can find them. Profile editing is planned for the next iteration.

## Security
All chat access depends on Supabase Row Level Security policies. The publishable key is not a secret; RLS is the security boundary. Never disable RLS to fix a client error.
