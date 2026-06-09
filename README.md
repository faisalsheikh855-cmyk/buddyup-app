# BuddyUp Native

BuddyUp is an Expo React Native app for finding nearby activity partners. This migration establishes an iOS/Android-first architecture and implements native onboarding and Supabase email authentication.

## Architecture

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the route structure, data boundaries, permission strategy and feature sequence.

## Implemented

- Supabase email authentication with persisted native/web sessions and automatic profile creation.
- Public activity feed, verified-member activity creation, join requests and host decisions.
- Accepted-request conversations with Row Level Security and Realtime message refresh.
- Selfie-only MVP verification with private uploads and an admin approval dashboard.
- Public avatars, profile editing, interests, trust badges and verification gating.
- Reporting, blocking, public-meetup reminders and post-activity safety check-ins.
- Light, dark and device appearance modes.

## Run

```bash
npm install
npx expo start
```

Use `i` for the iOS simulator or `a` for an Android emulator. Native modules and production notification behavior should be tested in a development build.

## Netlify Web Deployment

BuddyUp remains an iOS/Android Expo app, while its Expo web export deploys to Netlify as a companion web experience. Production does not depend on a local Metro server. `netlify.toml` runs `npm run build:web`, publishes `dist`, routes `/` to the prerendered onboarding experience, and contains a non-forced fallback rewrite for unmatched client routes. Expo-generated HTML files and bundled assets continue to be served directly.

### Deploy

1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Netlify, select **Add new project** > **Import an existing project**, then select the repository.
3. Keep the configuration from `netlify.toml`: build command `npm run build:web` and publish directory `dist`.
4. Open **Project configuration** > **Environment variables** and add the Supabase public client variables listed below.
5. Trigger a deploy. Netlify runs the Expo web export and serves the resulting static site.
6. In Supabase authentication URL configuration, set the Site URL to the Netlify production URL, such as `https://your-site.netlify.app`, and add redirect URLs for every deployed web origin that should receive email auth links.

### Netlify Environment Variables

Add these variables to Netlify for all production deploy contexts that should use Supabase:

| Variable | Required value | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Your project URL, for example `https://your-project-ref.supabase.co` | Supabase API/Auth endpoint. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your project's public publishable key, typically starting with `sb_publishable_` | Browser/mobile-safe client key used with Row Level Security. |

Find both values in the Supabase project dashboard under project API settings. If an older Supabase project only exposes a legacy public `anon` key, set `EXPO_PUBLIC_SUPABASE_ANON_KEY` instead of `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the app accepts it as a fallback.

Do not add a Supabase secret key or `service_role` key to this Expo web build. Variables prefixed with `EXPO_PUBLIC_` are intentionally embedded in the browser bundle, so database access must be protected by Row Level Security policies.

The web build generates `public/env.js` from these Netlify variables before exporting the Expo static site. If a deploy preview still says Supabase keys are missing, confirm the variables are enabled for deploy previews as well as production.

### Supabase Auth Redirects

Email confirmation links return to `/auth` on the current web origin. In the Supabase dashboard, open **Authentication** > **URL Configuration** and add allowed redirect URLs for:

- `https://your-site.netlify.app/auth`
- Your custom production domain with `/auth`, when used
- Deploy preview origins with `/auth`, when previews should support signup confirmation

If Supabase sends users to `localhost`, the project Site URL is still set to a localhost value or the deployed `/auth` URL has not been added to the allow list.

### Route Handling

Expo Router is configured with `web.output: "static"` and emits HTML pages for known routes during `npm run build:web`. Netlify directs the empty static root redirect page to `/onboarding`, which contains visible prerendered UI for first visits. The fallback rewrite uses `force = false`, so other generated pages and `_expo` assets are served normally. For an app URL not represented by a generated file, Netlify serves `/index.html` with status `200`, allowing Expo Router to handle the path after browser startup instead of returning a refresh-time 404.

Native iOS and Android releases use Expo EAS builds and the Apple App Store / Google Play Store, rather than Netlify hosting.

## GitHub Pages Deployment

The Expo web export can be hosted from a `gh-pages` branch.

For `faisalsheikh855-cmyk/buddyup-app`, the Pages URL is:

```text
https://faisalsheikh855-cmyk.github.io/buddyup-app/
```

### Setup

1. Build with `EXPO_BASE_URL=/buddyup-app npm run build:web`.
2. Copy `dist/index.html` to `dist/404.html`.
3. Add an empty `dist/.nojekyll` file.
4. Push the contents of `dist` to the `gh-pages` branch.
5. In GitHub, open **Settings** > **Pages** and set **Source** to **Deploy from a branch**, branch `gh-pages`, folder `/`.
6. In Supabase **Authentication** > **URL Configuration**, add `https://faisalsheikh855-cmyk.github.io/buddyup-app/auth` as an allowed redirect URL.

The `EXPO_BASE_URL` value makes generated assets load under `/buddyup-app`. The `404.html` fallback lets direct links such as `/buddyup-app/auth` load the app, and `.nojekyll` ensures GitHub Pages serves Expo's generated assets normally.

## Supabase Production Setup

Run the SQL files in this exact order using **Supabase Dashboard → SQL Editor → New query**:

1. [`supabase/schema.sql`](supabase/schema.sql): tables, compatibility upgrades, triggers, functions and indexes.
2. [`supabase/rls.sql`](supabase/rls.sql): Row Level Security policies and restricted profile update privileges.
3. [`supabase/storage.sql`](supabase/storage.sql): public avatar and private selfie buckets with folder-scoped policies.
4. [`supabase/seed.sql`](supabase/seed.sql): optional development examples only.

For the fastest setup, run [`supabase/setup.sql`](supabase/setup.sql) once instead. It combines steps 1–3 in the correct order. Regenerate it after SQL changes with:

```bash
npm run build:supabase
```

Then:

1. Copy `.env.example` to `.env.local`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. In Supabase **Authentication → URL Configuration**, set the production Site URL and add its `/auth` redirect URL.
4. Create the first admin after that user has signed up:

```sql
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'your-admin@email.com');
```

5. Sign out and back in. Admins can open **Settings → Selfie verification reviews**, or navigate to `/admin/verifications`.

Do not put a service-role key in Expo, Netlify or any browser-accessible environment variable. Admin verification uses the authenticated `review_selfie_verification` database function, which checks `profiles.is_admin` server-side.

### Netlify Backend Variables

In **Netlify → Project configuration → Environment variables**, add:

```text
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Redeploy after changing variables. The build command is `npm run build:web` and the publish directory is `dist`.

### Backend Smoke Test

1. Sign up and confirm the email.
2. Complete full name, username, city and interests.
3. Upload an avatar.
4. Take and submit a selfie; the profile becomes `pending`.
5. Confirm creating and joining remain blocked.
6. Approve the selfie from an admin account.
7. Confirm the member becomes `verified` and can create an activity.
8. Use a second verified account to request access.
9. Accept the request and open the automatically created conversation.
10. Send messages from both accounts, then test report, block and safety check-in actions.
