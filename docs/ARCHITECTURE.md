# BuddyUp Native Architecture

## Product Boundary

BuddyUp is a platonic activity-partner app for iOS and Android. The first native delivery slice is onboarding and authentication. Activity discovery, posting, requests, chat, profile management, notifications, and settings have route ownership defined here and will be implemented on top of the same foundation.

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

The existing Supabase SQL remains the baseline for profiles, activities, requests, conversations, and messages. Native additions planned after auth:

- Storage bucket and policies for avatar/activity media.
- Device push token table scoped to authenticated profiles.
- Latitude/longitude or geohash data with privacy-preserving distance queries.
- Realtime message subscription policies.

## Deployment

- Netlify deploys the universal web build using `npm run build:web` and publishes `dist`.
- The production root URL redirects to the prerendered onboarding route so first paint contains visible application UI rather than Expo Router's empty redirect document.
- Expo-generated static routes are served directly; a non-forced Netlify rewrite loads `index.html` only for unmatched app routes so browser refreshes do not fail with a CDN 404.
- Netlify environment variables provide the public Supabase URL and publishable client key at web build time.
- iOS and Android releases use EAS Build and platform stores; Netlify does not distribute native application binaries.

## Implementation Sequence

1. Native Expo foundation, providers, semantic UI primitives.
2. Onboarding and Supabase email authentication.
3. Authenticated tab shell, profile completion, media upload and location consent.
4. Activity feed/create/detail with animated gestures.
5. Requests, realtime chat, notifications and settings.
