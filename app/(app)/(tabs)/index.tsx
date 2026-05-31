import { ActivityIndicator, ImageBackground, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useActivities, useRequestToJoin } from "@/features/activities/hooks";
import type { Activity } from "@/features/activities/api";
import { colors } from "@/theme/tokens";

type Category = {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  image: string;
  tint: string;
};

type Plan = {
  id: string;
  title: string;
  sport: string;
  when: string;
  place: string;
  distance: string;
  level: string;
  spots: string;
  host: string;
  trust: string;
  image: string;
  tint: string;
  requestStatus?: Activity["request_status"];
};

const filters = ["Today", "Tomorrow", "This weekend", "Nearby", "Beginner", "Indoor", "Needs 1 more"];

const categories: Category[] = [
  {
    title: "Tennis",
    count: 42,
    icon: "tennisball-outline",
    image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(54, 132, 62, 0.62)",
  },
  {
    title: "Badminton",
    count: 35,
    icon: "flash-outline",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(8, 127, 99, 0.66)",
  },
  {
    title: "Chess",
    count: 24,
    icon: "extension-puzzle-outline",
    image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(86, 70, 53, 0.68)",
  },
  {
    title: "Table tennis",
    count: 31,
    icon: "ellipse-outline",
    image: "https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(0, 115, 150, 0.66)",
  },
  {
    title: "Basketball",
    count: 27,
    icon: "basketball-outline",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(213, 92, 43, 0.64)",
  },
  {
    title: "Run club",
    count: 33,
    icon: "walk-outline",
    image: "https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(238, 105, 54, 0.62)",
  },
];

const featuredPlan: Plan = {
  id: "badminton-tonight",
  title: "Badminton doubles after work",
  sport: "Badminton",
  when: "Today, 6:30 PM",
  place: "Roundhouse Centre",
  distance: "1.2 km",
  level: "All levels",
  spots: "3/4 joined",
  host: "Hosted by Maya",
  trust: "Verified host",
  image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85",
  tint: "rgba(8, 127, 99, 0.64)",
};

const todayPlans: Plan[] = [
  featuredPlan,
  {
    id: "tennis-kits",
    title: "Tennis rally at Kits courts",
    sport: "Tennis",
    when: "Today, 7:15 PM",
    place: "Kitsilano Beach courts",
    distance: "2.0 km",
    level: "Intermediate",
    spots: "1 spot left",
    host: "Hosted by Arjun",
    trust: "Usually replies fast",
    image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(54, 132, 62, 0.58)",
  },
  {
    id: "chess-cafe",
    title: "Casual chess tables",
    sport: "Chess",
    when: "Tomorrow, 5:30 PM",
    place: "Bean Around the World",
    distance: "0.8 km",
    level: "Beginner friendly",
    spots: "5 open spots",
    host: "Hosted by Lina",
    trust: "New player friendly",
    image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(86, 70, 53, 0.58)",
  },
];

const beginnerPlans: Plan[] = [
  {
    id: "table-tennis-casual",
    title: "Casual table tennis rotation",
    sport: "Table tennis",
    when: "Friday, 6:00 PM",
    place: "Community rec room",
    distance: "1.6 km",
    level: "Casual",
    spots: "2 spots left",
    host: "Hosted by Sam",
    trust: "Verified host",
    image: "https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(0, 115, 150, 0.58)",
  },
  {
    id: "coffee-walk",
    title: "Coffee and seawall walk",
    sport: "Walk",
    when: "Tomorrow, 9:00 AM",
    place: "English Bay",
    distance: "0.8 km",
    level: "Easy",
    spots: "3 open spots",
    host: "Hosted by Alex",
    trust: "Usually replies fast",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(7, 128, 119, 0.58)",
  },
];

const imageByCategory: Record<string, Pick<Plan, "image" | "tint">> = {
  Badminton: {
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85",
    tint: "rgba(8, 127, 99, 0.64)",
  },
  Tennis: {
    image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(54, 132, 62, 0.58)",
  },
  Chess: {
    image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(86, 70, 53, 0.58)",
  },
  "Table tennis": {
    image: "https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(0, 115, 150, 0.58)",
  },
  Basketball: {
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(213, 92, 43, 0.58)",
  },
};

function planFromActivity(activity: Activity): Plan {
  const visual = imageByCategory[activity.category] ?? {
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=85",
    tint: "rgba(8, 127, 99, 0.58)",
  };

  return {
    id: activity.id,
    title: activity.title,
    sport: activity.category,
    when: `${activity.date_label}, ${activity.starts_at}`,
    place: activity.location,
    distance: activity.distance_km ? `${activity.distance_km} km` : "Nearby",
    level: activity.pace,
    spots: `${activity.spots} open ${activity.spots === 1 ? "spot" : "spots"}`,
    host: `Hosted by ${activity.host?.name ?? "BuddyUp host"}`,
    trust: activity.host?.neighborhood ? `${activity.host.neighborhood} host` : "Verified host",
    requestStatus: activity.request_status,
    ...visual,
  };
}

function SearchBox() {
  return (
    <View className="mb-4 flex-row items-center rounded-[18px] border border-line bg-white px-4 py-3 shadow-sm">
      <Ionicons name="search" size={19} color={colors.muted} />
      <TextInput
        className="ml-3 min-w-0 flex-1 text-[15px] font-semibold text-ink"
        placeholder="Search tennis, chess, beginner..."
        placeholderTextColor="#8B9892"
      />
      <View className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-brand-soft">
        <Ionicons name="options-outline" size={17} color={colors.brand} />
      </View>
    </View>
  );
}

function FilterBar() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 mb-5" contentContainerClassName="gap-2 px-5">
      {filters.map((filter, index) => (
        <Pressable
          key={filter}
          className={`rounded-full px-4 py-2.5 ${index === 0 ? "bg-ink" : "border border-line bg-white"}`}
        >
          <Text className={`text-[13px] font-extrabold ${index === 0 ? "text-white" : "text-ink"}`}>{filter}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function JoinPill({ plan, onJoin, compact = false }: { plan: Plan; onJoin: (plan: Plan) => void; compact?: boolean }) {
  const label = plan.requestStatus === "accepted"
    ? "Accepted"
    : plan.requestStatus === "pending"
      ? "Pending"
      : plan.requestStatus === "declined"
        ? "Declined"
        : "Join";

  return (
    <Pressable
      disabled={Boolean(plan.requestStatus)}
      className={`${compact ? "px-3 py-1.5" : "px-4 py-2.5"} rounded-full ${plan.requestStatus ? "bg-brand-soft" : "bg-brand"}`}
      onPress={() => onJoin(plan)}
    >
      <Text className={`${compact ? "text-[11px]" : "text-[13px]"} font-extrabold ${plan.requestStatus ? "text-brand" : "text-white"}`}>{label}</Text>
    </Pressable>
  );
}

function FeaturedPlan({ plan, onJoin }: { plan: Plan; onJoin: (plan: Plan) => void }) {
  return (
    <Pressable className="overflow-hidden rounded-[26px] bg-ink active:opacity-90" onPress={() => router.push(`/(app)/activities/${plan.id}`)}>
      <ImageBackground source={{ uri: plan.image }} resizeMode="cover" className="h-[258px] w-full">
        <View className="absolute inset-0" style={{ backgroundColor: plan.tint }} />
        <View className="absolute inset-0 bg-black/10" />
        <View className="absolute inset-x-0 bottom-0 h-3/5 bg-black/40" />
        <View className="flex-1 justify-between p-5">
          <View className="flex-row items-start justify-between">
            <View className="rounded-full bg-white/20 px-3 py-1.5">
              <Text className="text-[12px] font-extrabold text-white">{plan.sport}</Text>
            </View>
            <View className="rounded-full border border-white/75 bg-black/25 px-3 py-1.5">
              <Text className="text-[12px] font-extrabold text-white">{plan.spots}</Text>
            </View>
          </View>
          <View>
            <Text className="text-[30px] font-extrabold leading-tight text-white">{plan.title}</Text>
            <View className="mt-3 gap-1">
              <Text className="text-[14px] font-bold text-white/90">{plan.when} · {plan.distance}</Text>
              <Text className="text-[13px] font-semibold text-white/78">{plan.place} · {plan.level}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
      <View className="flex-row items-center justify-between bg-white px-4 py-4">
        <View className="min-w-0 flex-1 pr-3">
          <Text className="text-[13px] font-extrabold text-ink">{plan.host}</Text>
          <Text className="mt-0.5 text-[12px] font-semibold text-muted">{plan.trust}</Text>
        </View>
        <JoinPill plan={plan} onJoin={onJoin} />
      </View>
    </Pressable>
  );
}

function CategoryCard({ category, width }: { category: Category; width: number }) {
  return (
    <Pressable className="overflow-hidden rounded-[20px] bg-ink active:opacity-90" style={{ width, height: 136 }}>
      <ImageBackground source={{ uri: category.image }} resizeMode="cover" className="h-full w-full">
        <View className="absolute inset-0" style={{ backgroundColor: category.tint }} />
        <View className="absolute inset-x-0 bottom-0 h-1/2 bg-black/30" />
        <View className="flex-1 justify-between p-3.5">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Ionicons name={category.icon} size={18} color={colors.white} />
          </View>
          <View>
            <Text className="text-[21px] font-extrabold leading-tight text-white">{category.title}</Text>
            <Text className="mt-0.5 text-[12px] font-bold text-white/80">{category.count} nearby</Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function PlanCard({ plan, onJoin }: { plan: Plan; onJoin: (plan: Plan) => void }) {
  return (
    <Pressable className="flex-row gap-3 rounded-[22px] border border-line bg-white p-3 active:bg-brand-soft" onPress={() => router.push(`/(app)/activities/${plan.id}`)}>
      <ImageBackground source={{ uri: plan.image }} resizeMode="cover" className="h-[96px] w-[96px] overflow-hidden rounded-[18px]">
        <View className="absolute inset-0" style={{ backgroundColor: plan.tint }} />
        <View className="absolute bottom-2 left-2 rounded-full bg-black/35 px-2 py-1">
          <Text className="text-[10px] font-extrabold text-white">{plan.sport}</Text>
        </View>
      </ImageBackground>
      <View className="min-w-0 flex-1 justify-between py-0.5">
        <View>
          <View className="mb-1 flex-row items-center justify-between gap-2">
            <Text className="text-[12px] font-extrabold text-brand">{plan.when}</Text>
            <Text className="text-[11px] font-bold text-muted">{plan.distance}</Text>
          </View>
          <Text className="text-[17px] font-extrabold leading-5 text-ink">{plan.title}</Text>
          <Text className="mt-1 text-[12px] font-semibold text-muted">{plan.place}</Text>
        </View>
        <View className="mt-2 flex-row items-center justify-between gap-2">
          <Text className="min-w-0 flex-1 text-[12px] font-bold text-ink">{plan.spots} · {plan.level}</Text>
          <JoinPill plan={plan} onJoin={onJoin} compact />
        </View>
      </View>
    </Pressable>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View className="mb-3 mt-7 flex-row items-center justify-between">
      <Text className="text-[22px] font-extrabold text-ink">{title}</Text>
      {action ? <Text className="text-[13px] font-extrabold text-brand">{action}</Text> : null}
    </View>
  );
}

function EmptyHint() {
  return (
    <View className="mt-6 rounded-[22px] border border-line bg-white p-4">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-coral-soft">
        <Ionicons name="sparkles-outline" size={19} color={colors.coral} />
      </View>
      <Text className="text-[16px] font-extrabold text-ink">Not seeing your sport?</Text>
      <Text className="mt-1 text-[13px] leading-5 text-muted">Create a plan for pickleball, volleyball, climbing, or anything else. People nearby can request to join.</Text>
    </View>
  );
}

export default function FeedScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const activitiesQuery = useActivities();
  const joinMutation = useRequestToJoin();
  const contentWidth = Math.min(viewportWidth, 480) - 40;
  const gap = 12;
  const categoryWidth = (contentWidth - gap) / 2;
  const livePlans = (activitiesQuery.data ?? []).map(planFromActivity);
  const displayedFeaturedPlan = livePlans[0] ?? featuredPlan;
  const displayedTodayPlans = livePlans.length ? livePlans : todayPlans;
  const displayedBeginnerPlans = livePlans.filter((plan) => /beginner|casual|easy|all/i.test(plan.level)).slice(0, 4);

  function joinPlan(plan: Plan) {
    joinMutation.mutate({ activityId: plan.id });
  }

  return (
    <Screen>
      <ScrollView
        className="-mx-5 flex-1"
        contentContainerClassName="px-5 pb-32"
        showsVerticalScrollIndicator={false}
      >
        <View className="pb-6 pt-4">
          <View className="mb-5 flex-row items-center justify-between">
            <View className="min-w-0 flex-1 pr-4">
              <Text className="text-[32px] font-extrabold tracking-tight text-ink">What do you want to play?</Text>
              <Text className="mt-1 text-[15px] font-semibold text-muted">Find games, clubs, and activity buddies nearby</Text>
            </View>
            <Pressable
              className="h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm active:bg-brand-soft"
              onPress={() => router.push("/(app)/notifications")}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.ink} />
            </Pressable>
          </View>

          <SearchBox />
          <FilterBar />

          {activitiesQuery.isLoading ? (
            <View className="mb-3 rounded-[20px] border border-line bg-white p-4">
              <ActivityIndicator color={colors.brand} />
              <Text className="mt-2 text-center text-[13px] font-semibold text-muted">Loading nearby activities...</Text>
            </View>
          ) : null}

          {activitiesQuery.error ? (
            <View className="mb-3 rounded-[20px] bg-coral-soft p-4">
              <Text className="text-[13px] font-bold text-[#A4483F]">
                {isSupabaseConfigured ? "Could not load activities. Make sure the Supabase schema has been applied." : "Add Supabase environment keys to load real activities."}
              </Text>
            </View>
          ) : null}

          {joinMutation.error ? (
            <View className="mb-3 rounded-[20px] bg-coral-soft p-4">
              <Text className="text-[13px] font-bold text-[#A4483F]">{joinMutation.error.message}</Text>
            </View>
          ) : null}

          <SectionHeader title="Best match near you" />
          <FeaturedPlan plan={displayedFeaturedPlan} onJoin={joinPlan} />

          <SectionHeader title="Popular activities" action="See all" />
          <View className="flex-row flex-wrap" style={{ gap }}>
            {categories.map((category) => (
              <CategoryCard key={category.title} category={category} width={categoryWidth} />
            ))}
          </View>

          <SectionHeader title="Available today" action="View map" />
          <View className="gap-3">
            {displayedTodayPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onJoin={joinPlan} />
            ))}
          </View>

          <SectionHeader title="Beginner friendly" />
          <View className="gap-3">
            {(displayedBeginnerPlans.length ? displayedBeginnerPlans : beginnerPlans).map((plan) => (
              <PlanCard key={plan.id} plan={plan} onJoin={joinPlan} />
            ))}
          </View>

          <EmptyHint />
        </View>
      </ScrollView>
    </Screen>
  );
}
