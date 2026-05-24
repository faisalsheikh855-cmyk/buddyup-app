import { useRef, useState } from "react";
import { FlatList, ImageBackground, Platform, Pressable, Text, useWindowDimensions, View, ViewToken } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { onboardingSlides, OnboardingSlide } from "@/features/onboarding/slides";
import { useSessionStore } from "@/store/session-store";
import { colors } from "@/theme/tokens";

const AnimatedList = Animated.createAnimatedComponent(FlatList<OnboardingSlide>);

function ProgressDot({ index, scrollX, width }: { index: number; scrollX: SharedValue<number>; width: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value / width, [index - 1, index, index + 1], [8, 28, 8], "clamp"),
    opacity: interpolate(scrollX.value / width, [index - 1, index, index + 1], [0.4, 1, 0.4], "clamp"),
  }));

  return <Animated.View className="h-2 rounded-full bg-brand" style={animatedStyle} />;
}

function Slide({ item, width }: { item: OnboardingSlide; width?: number }) {
  return (
    <View style={width ? { width } : undefined} className="w-full min-w-0 flex-1 px-5 pb-2 pt-3">
      <View className="h-[46%] min-h-[315px] overflow-hidden rounded-app bg-brand-soft">
        <ImageBackground
          source={require("../../assets/images/onboarding-hero.jpg")}
          resizeMode="cover"
          className="flex-1 justify-end"
          imageStyle={{ opacity: item.id === "discover" ? 1 : 0.3 }}
        >
          <View className="absolute inset-0 bg-black/10" />
          <View className="m-4 self-start rounded-full bg-white/95 p-3">
            <Ionicons name={item.icon} size={25} color={item.accent} />
          </View>
          <View className="flex-row flex-wrap gap-2 p-4">
            {item.activityTags.map((tag) => (
              <View key={tag} className="rounded-full bg-white px-3 py-2">
                <Text className="text-[12px] font-semibold text-ink">{tag}</Text>
              </View>
            ))}
          </View>
        </ImageBackground>
      </View>
      <View className="flex-1 pt-8">
        <Text className="mb-3 text-[13px] font-bold uppercase text-brand">{item.eyebrow}</Text>
        <Text className="block w-full mb-4 text-[31px] font-bold leading-[37px] text-ink">{item.title}</Text>
        <Text className="block w-full text-[16px] leading-6 text-muted">{item.copy}</Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const webFrameWidth = Math.min(width || 390, 480);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const finishOnboarding = useSessionStore((state) => state.finishOnboarding);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  function finish() {
    finishOnboarding();
    router.replace("/(public)/auth");
  }

  function continueForward() {
    if (activeIndex === onboardingSlides.length - 1) {
      finish();
      return;
    }
    if (Platform.OS === "web") {
      setActiveIndex((current) => current + 1);
      return;
    }
    listRef.current?.scrollToIndex({ animated: true, index: activeIndex + 1 });
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<OnboardingSlide>[] }) => {
    if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
  }).current;

  return (
    <View
      className="w-full min-w-0 flex-1 overflow-hidden bg-canvas pt-12"
      style={Platform.OS === "web" ? { alignSelf: "center", maxWidth: "100%", width: webFrameWidth } : undefined}
    >
      <View className="h-10 flex-row items-center justify-between px-5">
        <Text className="text-[22px] font-bold text-brand">BuddyUp</Text>
        {activeIndex < onboardingSlides.length - 1 ? (
          <Pressable onPress={finish} hitSlop={14}>
            <Text className="text-[14px] font-semibold text-muted">Skip</Text>
          </Pressable>
        ) : <View className="w-8" />}
      </View>
      {Platform.OS === "web" ? (
        <Slide item={onboardingSlides[activeIndex]} width={webFrameWidth} />
      ) : (
        <AnimatedList
          ref={listRef}
          data={onboardingSlides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Slide item={item} width={width} />}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        />
      )}
      <View className="gap-6 px-5 pb-8">
        <View className="h-3 flex-row items-center justify-center gap-2">
          {onboardingSlides.map((slide, index) => (
            Platform.OS === "web" ? (
              <View key={slide.id} className="h-2 rounded-full bg-brand" style={{ width: activeIndex === index ? 28 : 8, opacity: activeIndex === index ? 1 : 0.4 }} />
            ) : (
              <ProgressDot key={slide.id} index={index} scrollX={scrollX} width={Math.max(width, 1)} />
            )
          ))}
        </View>
        <Button
          onPress={continueForward}
          icon={<Ionicons name="arrow-forward" size={18} color={colors.white} />}
        >
          {activeIndex === onboardingSlides.length - 1 ? "Get started" : "Continue"}
        </Button>
      </View>
    </View>
  );
}
