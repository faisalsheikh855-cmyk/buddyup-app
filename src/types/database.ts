export type ActivityCategory =
  | "Badminton"
  | "Tennis"
  | "Table tennis"
  | "Basketball"
  | "Chess"
  | "Board games"
  | "Run club"
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
