import { Ionicons } from "@expo/vector-icons";

export type OnboardingSlide = {
  id: string;
  eyebrow: string;
  title: string;
  copy: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  activityTags: string[];
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "discover",
    eyebrow: "BuddyUp",
    title: "Plans hit different with a buddy",
    copy: "Meet nearby people who are ready for badminton, coffee runs, gym sessions and more.",
    accent: "#087F63",
    icon: "people-outline",
    activityTags: ["Badminton", "Coffee", "Hiking"],
  },
  {
    id: "request",
    eyebrow: "Join your way",
    title: "Request. Chat. Show up.",
    copy: "Every activity has a host and a clear plan. Join the ones that match your energy.",
    accent: "#F05B4F",
    icon: "chatbubbles-outline",
    activityTags: ["Pickleball", "Soccer", "Walks"],
  },
  {
    id: "local",
    eyebrow: "Nearby energy",
    title: "Keep it social, never dating",
    copy: "BuddyUp is built around shared activities, trusted meetups and new friendships.",
    accent: "#087F63",
    icon: "location-outline",
    activityTags: ["Tennis", "Rec Room", "Shopping"],
  },
];
