export type ActivityCategory =
  | "Badminton"
  | "Tennis"
  | "Gym"
  | "Shopping"
  | "Hiking"
  | "Soccer"
  | "Pickleball"
  | "Coffee"
  | "Walks"
  | "Rec Room";

export type ProfileDraft = {
  displayName: string;
  neighborhood: string;
  interests: ActivityCategory[];
  photoUri: string | null;
};
