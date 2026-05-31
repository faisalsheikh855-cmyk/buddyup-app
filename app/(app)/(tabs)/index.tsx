import { ImageBackground, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/theme/tokens";

type ActivityCard = {
  title: string;
  count: number;
  when: string;
  level: string;
  image: string;
  tint: string;
};

type ActivitySection = {
  title: string;
  subtitle: string;
  cards: ActivityCard[];
};

const filters = ["Today", "Nearby", "Beginner", "Indoor"];

const featured: ActivityCard = {
  title: "Badminton after work",
  count: 18,
  when: "Today, 6:30 PM",
  level: "All levels",
  image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85",
  tint: "rgba(8, 127, 99, 0.62)",
};

const sections: ActivitySection[] = [
  {
    title: "Popular sports",
    subtitle: "Join games people are already planning nearby",
    cards: [
      {
        title: "Tennis",
        count: 42,
        when: "Tonight",
        level: "Intermediate",
        image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=85",
        tint: "rgba(68, 142, 72, 0.62)",
      },
      {
        title: "Table tennis",
        count: 31,
        when: "Today",
        level: "Casual",
        image: "https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=900&q=85",
        tint: "rgba(0, 115, 150, 0.66)",
      },
      {
        title: "Basketball",
        count: 27,
        when: "This week",
        level: "Pickup",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=85",
        tint: "rgba(213, 92, 43, 0.64)",
      },
      {
        title: "Badminton",
        count: 35,
        when: "Tomorrow",
        level: "Doubles",
        image: "https://images.unsplash.com/photo-1613918431703-aa50889e3be0?auto=format&fit=crop&w=900&q=85",
        tint: "rgba(21, 132, 96, 0.66)",
      },
    ],
  },
  {
    title: "Mind games",
    subtitle: "Low-sweat plans for strategy and conversation",
    cards: [
      {
        title: "Chess",
        count: 24,
        when: "Tonight",
        level: "Open tables",
        image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=900&q=85",
        tint: "rgba(86, 70, 53, 0.66)",
      },
      {
        title: "Board games",
        count: 19,
        when: "Friday",
        level: "Beginner",
        image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=900&q=85",
        tint: "rgba(126, 78, 164, 0.64)",
      },
    ],
  },
  {
    title: "Move together",
    subtitle: "Simple ways to meet without over-planning",
    cards: [
      {
        title: "Run club",
        count: 33,
        when: "Sat morning",
        level: "5K pace",
        image: "https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&w=900&q=85",
        tint: "rgba(238, 105, 54, 0.62)",
      },
      {
        title: "Coffee walk",
        count: 21,
        when: "Tomorrow",
        level: "Easy",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=85",
        tint: "rgba(7, 128, 119, 0.64)",
      },
    ],
  },
];

function CountBadge({ count }: { count: number }) {
  return (
    <View className="flex-row items-center rounded-full border border-white/80 bg-black/25 px-2.5 py-1">
      <Ionicons name="people" size={13} color={colors.white} />
      <Text className="ml-1 text-[12px] font-extrabold text-white">{count}</Text>
    </View>
  );
}

function ActivityTile({
  card,
  width,
  featuredCard = false,
}: {
  card: ActivityCard;
  width: number;
  featuredCard?: boolean;
}) {
  const height = featuredCard ? Math.min(250, width * 0.57) : Math.min(230, width * 1.16);

  return (
    <Pressable
      className="overflow-hidden rounded-[24px] bg-ink active:opacity-90"
      style={{ height, width }}
      onPress={() => router.push("/(app)/activities/badminton-tonight")}
    >
      <ImageBackground source={{ uri: card.image }} resizeMode="cover" className="h-full w-full">
        <View className="absolute inset-0" style={{ backgroundColor: card.tint }} />
        <View className="absolute inset-0 bg-black/10" />
        <View className="absolute inset-x-0 bottom-0 h-1/2 bg-black/35" />
        <View className="flex-1 justify-between p-4">
          <View className="flex-row items-start justify-between gap-2">
            <View className="rounded-full bg-white/20 px-3 py-1.5">
              <Text className="text-[11px] font-extrabold text-white">{card.when}</Text>
            </View>
            <CountBadge count={card.count} />
          </View>
          <View>
            <Text className={`${featuredCard ? "text-[30px]" : "text-[25px]"} font-extrabold leading-tight text-white`}>
              {card.title}
            </Text>
            <Text className="mt-1 text-[13px] font-bold text-white/85">{card.level}</Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="mb-4 mt-8">
      <Text className="text-[24px] font-extrabold leading-tight text-ink">{title}</Text>
      <Text className="mt-1 text-[15px] font-semibold leading-5 text-muted">{subtitle}</Text>
    </View>
  );
}

export default function FeedScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const contentWidth = Math.min(viewportWidth, 480) - 40;
  const gap = 12;
  const tileWidth = (contentWidth - gap) / 2;

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
              <Text className="text-[34px] font-extrabold tracking-tight text-ink">Explore</Text>
              <Text className="mt-1 text-[15px] font-semibold text-muted">Find games, clubs, and activity buddies</Text>
            </View>
            <Pressable
              className="h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm active:bg-brand-soft"
              onPress={() => router.push("/(app)/notifications")}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.ink} />
            </Pressable>
          </View>

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

          <ActivityTile card={featured} width={contentWidth} featuredCard />

          {sections.map((section) => (
            <View key={section.title}>
              <SectionHeader title={section.title} subtitle={section.subtitle} />
              <View className="flex-row flex-wrap" style={{ gap }}>
                {section.cards.map((card) => (
                  <ActivityTile key={card.title} card={card} width={tileWidth} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
