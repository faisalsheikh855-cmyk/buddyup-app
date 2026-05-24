# BuddyUp Native

BuddyUp is an Expo React Native app for finding nearby activity partners. This migration establishes an iOS/Android-first architecture and implements native onboarding and Supabase email authentication.

## Architecture

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the route structure, data boundaries, permission strategy and feature sequence.

## Implemented

- Expo Router root navigation with public/authenticated route groups and native tabs.
- Swipeable Reanimated onboarding with bundled visual asset.
- Native sign-up/login form using React Query mutations and persisted Supabase sessions.
- No-key preview entry from auth so the navigation shell can be reviewed before backend setup.
- Zustand ownership of local onboarding and session hydration state.
- Initial authenticated navigation shell with feed, detail, chat, requests, profile, notifications and settings destinations.
- Profile entry points for foreground location permission, camera capture and gallery selection.

Activity publishing, server-backed feed/requests/chat, storage uploads and push notification registration are intentionally subsequent slices.

## Run

```bash
npm install
npx expo start
```

Use `i` for the iOS simulator or `a` for an Android emulator. Native modules and production notification behavior should be tested in a development build.

## Netlify Web Deployment

BuddyUp remains an iOS/Android Expo app, while its Expo web export deploys to Netlify as a companion web experience. Production does not depend on a local Metro server. `netlify.toml` runs `npm run build:web`, publishes `dist`, and contains a non-forced fallback rewrite for unmatched client routes. Expo-generated HTML files and bundled assets continue to be served directly.

### Deploy

1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Netlify, select **Add new project** > **Import an existing project**, then select the repository.
3. Keep the configuration from `netlify.toml`: build command `npm run build:web` and publish directory `dist`.
4. Open **Project configuration** > **Environment variables** and add the Supabase public client variables listed below.
5. Trigger a deploy. Netlify runs the Expo web export and serves the resulting static site.
6. In Supabase authentication URL configuration, set the Site URL to the Netlify production URL, such as `https://your-site.netlify.app`, and add any custom production domain as an allowed redirect URL when used.

### Netlify Environment Variables

Add these variables to Netlify for all production deploy contexts that should use Supabase:

| Variable | Required value | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Your project URL, for example `https://your-project-ref.supabase.co` | Supabase API/Auth endpoint. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your project's public publishable key, typically starting with `sb_publishable_` | Browser/mobile-safe client key used with Row Level Security. |

Find both values in the Supabase project dashboard under project API settings. If an older Supabase project only exposes a legacy public `anon` key, set `EXPO_PUBLIC_SUPABASE_ANON_KEY` instead of `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the app accepts it as a fallback.

Do not add a Supabase secret key or `service_role` key to this Expo web build. Variables prefixed with `EXPO_PUBLIC_` are intentionally embedded in the browser bundle, so database access must be protected by Row Level Security policies.

### Route Handling

Expo Router is configured with `web.output: "static"` and emits HTML pages for known routes during `npm run build:web`. The Netlify rewrite uses `force = false`, so those generated pages and `_expo` assets are served normally. For an app URL not represented by a generated file, Netlify serves `/index.html` with status `200`, allowing Expo Router to handle the path after browser startup instead of returning a refresh-time 404.

Native iOS and Android releases use Expo EAS builds and the Apple App Store / Google Play Store, rather than Netlify hosting.

## Supabase

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Copy `.env.example` to `.env.local`.
3. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A legacy public anon key in `EXPO_PUBLIC_SUPABASE_ANON_KEY` is also accepted during migration.
4. Configure authentication redirect/deep-link settings with the `buddyup` app scheme when adding external auth providers.

Without keys, use `Preview the app` on the authentication screen to explore the native UI. Real accounts and persisted authentication require Supabase configuration.
