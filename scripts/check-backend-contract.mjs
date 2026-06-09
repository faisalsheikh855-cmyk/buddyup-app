import { readFileSync } from "node:fs";

const schema = readFileSync("supabase/schema.sql", "utf8");
const rls = readFileSync("supabase/rls.sql", "utf8");
const storage = readFileSync("supabase/storage.sql", "utf8");
const setup = readFileSync("supabase/setup.sql", "utf8");
const profileApi = readFileSync("src/features/profile/api.ts", "utf8");
const activityApi = readFileSync("src/features/activities/api.ts", "utf8");
const adminScreen = readFileSync("app/(app)/admin/verifications.tsx", "utf8");

const requiredTables = [
  "profiles",
  "activities",
  "activity_requests",
  "conversations",
  "messages",
  "selfie_verifications",
  "reports",
  "blocks",
  "safety_checkins",
];

const requiredFunctions = [
  "is_verified_user",
  "users_are_blocked",
  "get_current_profile",
  "submit_selfie_verification",
  "review_selfie_verification",
  "accept_activity_request",
];

const requiredPolicies = [
  "Verified users create activities",
  "Verified users create requests",
  "Conversation members read messages",
  "Verified conversation members send messages",
  "Users and admins read selfie verification",
  "Verified users create reports",
  "Users create own blocks",
  "Activity members create checkins",
];

const failures = [];

for (const table of requiredTables) {
  if (!schema.includes(`public.${table}`)) failures.push(`Missing table: ${table}`);
  if (!rls.includes(`alter table public.${table} enable row level security`)) {
    failures.push(`RLS not enabled: ${table}`);
  }
}

for (const fn of requiredFunctions) {
  if (!schema.includes(`function public.${fn}`)) failures.push(`Missing function: ${fn}`);
}

for (const policy of requiredPolicies) {
  if (!rls.includes(`"${policy}"`)) failures.push(`Missing policy: ${policy}`);
}

for (const bucket of ["avatars", "selfie-verifications"]) {
  if (!storage.includes(`'${bucket}'`)) failures.push(`Missing storage bucket: ${bucket}`);
}

for (const source of [schema, rls, storage]) {
  if (!setup.includes(source.trim())) failures.push("supabase/setup.sql is stale; run npm run build:supabase");
}

if (!profileApi.includes('from("selfie_verifications")')) failures.push("Profile API is not connected to selfie_verifications");
if (!profileApi.includes('from("avatars")')) failures.push("Profile API is not connected to avatars storage");
if (!activityApi.includes('from("activity_requests")')) failures.push("Activity API is not connected to join requests");
if (!adminScreen.includes("useReviewSelfieVerification")) failures.push("Admin verification review screen is not connected");

const forbiddenMvpTerms = ["submitIdentityVerification", "identity-documents", "government ID"];
for (const term of forbiddenMvpTerms) {
  if ([profileApi, adminScreen].some((source) => source.includes(term))) {
    failures.push(`Government-ID MVP code remains: ${term}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Backend contract passed: ${requiredTables.length} tables, ${requiredFunctions.length} functions, ${requiredPolicies.length} critical policies, 2 storage buckets.`);
