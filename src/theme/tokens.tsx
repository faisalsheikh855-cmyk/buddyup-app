import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme, View } from "react-native";
import { vars } from "nativewind";
import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "buddyup-theme";

export const lightColors = {
  canvas: "#F7F8F5",
  white: "#FFFFFF",
  ink: "#14251F",
  muted: "#64746D",
  line: "#E4E8E4",
  brand: "#087F63",
  brandDark: "#05634C",
  brandSoft: "#E2F4EC",
  coral: "#F05B4F",
  coralSoft: "#FFEFEC",
} as const;

export const darkColors = {
  canvas: "#0E1512",
  white: "#FFFFFF",
  ink: "#F2F7F4",
  muted: "#9EAEA7",
  line: "#2B3832",
  brand: "#27B28B",
  brandDark: "#15936F",
  brandSoft: "#183B31",
  coral: "#FF7468",
  coralSoft: "#3A2422",
} as const;

export const colors = lightColors;

const lightVariables = vars({
  "--color-canvas": "247 248 245",
  "--color-surface": "255 255 255",
  "--color-ink": "20 37 31",
  "--color-muted": "100 116 109",
  "--color-line": "228 232 228",
  "--color-brand": "8 127 99",
  "--color-brand-dark": "5 99 76",
  "--color-brand-soft": "226 244 236",
  "--color-coral": "240 91 79",
  "--color-coral-soft": "255 239 236",
});

const darkVariables = vars({
  "--color-canvas": "14 21 18",
  "--color-surface": "23 33 29",
  "--color-ink": "242 247 244",
  "--color-muted": "158 174 167",
  "--color-line": "43 56 50",
  "--color-brand": "39 178 139",
  "--color-brand-dark": "21 147 111",
  "--color-brand-soft": "24 59 49",
  "--color-coral": "255 116 104",
  "--color-coral-soft": "58 36 34",
});

type ThemeState = {
  mode: ThemeMode;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",
  hydrated: false,
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        set({ mode: stored });
      }
    } finally {
      set({ hydrated: true });
    }
  },
  setMode: (mode) => {
    set({ mode });
    void AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => undefined);
  },
}));

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colors: typeof lightColors | typeof darkColors;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  resolvedTheme: "light",
  colors: lightColors,
  setMode: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((state) => state.mode);
  const hydrate = useThemeStore((state) => state.hydrate);
  const setMode = useThemeStore((state) => state.setMode);
  const resolvedTheme: ResolvedTheme = mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;
  const activeColors = resolvedTheme === "dark" ? darkColors : lightColors;
  const themeVariables = resolvedTheme === "dark" ? darkVariables : lightVariables;

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const value = useMemo(
    () => ({ mode, resolvedTheme, colors: activeColors, setMode }),
    [activeColors, mode, resolvedTheme, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View className="flex-1 bg-canvas" style={themeVariables}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  return useTheme().colors;
}
