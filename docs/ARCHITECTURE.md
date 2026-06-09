# BuddyUp Native Architecture

## Product Boundary

BuddyUp is a platonic activity-partner app for iOS, Android, and web. Its MVP includes authentication, profiles, selfie verification, activity discovery and hosting, join requests, accepted-member chat, blocking, reporting, and safety check-ins.

## Stack

| Concern | Choice | Responsibility |
| --- | --- | --- |
| Runtime | Expo SDK 55 / React Native | iOS and Android builds, device APIs |
| Routing | Expo Router | Native stacks, tabs, route protection, deep links |
| UI styling | NativeWind | Token-based utility styling for native views |
| Motion | Reanimated + Gesture Handler | Swipe onboarding and later card gestures |
| Remote state | TanStack React Query | Supabase reads, mutations, cache invalidation |
| Client state | Zustand | Session hydration and short-lived onboarding preferences |
| Backend | Supabase | Auth, PostgreSQL/RLS, storage and realtime chat |
| Device APIs | Expo Location / Image Picker / Notifications | Permission-gated feature adapters |

## Route Map

```text
app/
  _layout.tsx                     # Providers, session hydration, native root stack
  index.tsx                       # Session/onboarding redirect
  (public)/
    _layout.tsx                   # Public native stack
    onboarding.tsx                # Swipeable product orientation
    auth.tsx                      # Email login/sign-up
  (app)/
    _layout.tsx                   # Auth guard and authenticated stack
    (tabs)/
      _layout.tsx                 # Native bottom tabs
      index.tsx                   # Home feed
      create.tsx                  # Create activity
      requests.tsx                # Join requests
      profile.tsx                 # Profile
    activities/[id].tsx           # Activity detail
    chat/[id].tsx                 # Conversation
    notifications.tsx             # Notifications inbox
    settings.tsx                  # Account/settings
```

## Source Modules

```text
src/
  components/
    ui/                           # Buttons, fields, chips, screen layout
  features/
    auth/                         # Auth service, hooks and auth forms
    onboarding/                   # Slides and onboarding state
    activities/                   # Future queries, cards and post editor
    chat/                         # Future realtime messages/composer
    profile/                      # Future profile and media upload
  lib/
    query-client.ts               # Query lifecycle and native focus handling
    supabase.ts                   # Persisted native Supabase client
  store/
    session-store.ts              # Auth/session + onboarding completion
  theme/
    tokens.ts                     # Shared semantic colors
  types/
    database.ts                   # Supabase-facing domain types
```

## Navigation And State

- The root stack hydrates persisted session state before routing.
- Public routes contain onboarding and authentication only.
- Authenticated routes are guarded in `(app)/_layout.tsx`; a missing session redirects to auth unless the explicit local preview mode is active.
- Zustand stores local session/onboarding flags only. Server entities must not be duplicated into the store.
- React Query owns activity, request, profile, notification, and chat server data.

## Native Capability Plan

| Capability | Native module | Integration point | Timing |
| --- | --- | --- | --- |
| Foreground discovery location | `expo-location` | `src/features/profile` permission/service hook | Feed/profile slice |
| Profile and activity images | `expo-image-picker` + Supabase Storage | `src/features/profile/media` | Profile slice |
| Push notifications | `expo-notifications` + push token table | `src/features/notifications` | Notification slice |
| Swipe cards and transitions | Gesture Handler + Reanimated | `src/features/activities` | Feed slice |
| Realtime chat | Supabase Realtime | `src/features/chat` | Chat slice |

Permissions are requested at the moment a feature is used, with explanatory UI before system prompts. Authentication does not request location, camera, photos, or notifications.

## Backend Shape

- Supabase Auth creates and maintains one `profiles` row per account.
- PostgreSQL and RLS enforce verified-only activity creation, join requests, reporting, and messaging.
- Accepted requests create one host/participant conversation.
- Realtime refreshes message queries for conversation members.
- Public `avatars` and private `selfie-verifications` buckets use user-folder policies.
- Admin-only selfie review is enforced by a security-definer function that checks `profiles.is_admin`.
- Blocks are checked in profile, activity, request, and message policies.

## Deployment

- Netlify deploys the universal web build using `npm run build:web` and publishes `dist`.
- The production root URL redirects to the prerendered onboarding route so first paint contains visible application UI rather than Expo Router's empty redirect document.
- Expo-generated static routes are served directly; a non-forced Netlify rewrite loads `index.html` only for unmatched app routes so browser refreshes do not fail with a CDN 404.
- Netlify environment variables provide the public Supabase URL and publishable client key at web build time.
- iOS and Android releases use EAS Build and platform stores; Netlify does not distribute native application binaries.

## Production Validation

The required release checks are:

1. `npm run build:supabase`
2. `npm run test:backend`
3. `npm run typecheck`
4. `npm run lint`
5. `npm run build:web`
