import type { ActivityCategory } from "@/types/database";

export type FeedActivity = {
  id: string;
  title: string;
  category: ActivityCategory;
  when: string;
  location: string;
  distance: string;
  host: string;
  spots: number;
};

export const nearbyActivities: FeedActivity[] = [
  { id: "badminton-tonight", title: "Badminton doubles after work", category: "Badminton", when: "Today, 6:30 PM", location: "Roundhouse Centre", distance: "1.2 km", host: "Maya", spots: 2 },
  { id: "pickleball-saturday", title: "Beginner pickleball rally", category: "Pickleball", when: "Sat, 10:00 AM", location: "Queen Elizabeth courts", distance: "2.4 km", host: "Priya", spots: 3 },
  { id: "coffee-walk", title: "Coffee and seawall walk", category: "Coffee", when: "Tomorrow, 9:00 AM", location: "English Bay", distance: "0.8 km", host: "Alex", spots: 2 },
];
