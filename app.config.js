const baseUrl = process.env.EXPO_BASE_URL ?? "";

export default {
  expo: {
    name: "BuddyUp",
    slug: "buddyup",
    version: "1.0.0",
    icon: "./assets/images/app-icon.png",
    orientation: "portrait",
    scheme: "buddyup",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    web: {
      output: "static",
      favicon: "./assets/images/app-icon.png",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.buddyup.mobile",
      buildNumber: "1",
      infoPlist: {
        NSPhotoLibraryUsageDescription: "BuddyUp lets you choose current photos for your profile.",
        NSCameraUsageDescription: "BuddyUp uses the camera for your private selfie verification.",
      },
    },
    android: {
      package: "com.buddyup.mobile",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/images/app-icon.png",
        backgroundColor: "#062B22",
      },
    },
    splash: {
      image: "./assets/images/app-icon.png",
      resizeMode: "contain",
      backgroundColor: "#F7F8F5",
    },
    plugins: [
      "expo-router",
      [
        "expo-image-picker",
        {
          photosPermission: "BuddyUp lets you choose current photos for your profile.",
          cameraPermission: "BuddyUp uses your camera for private selfie verification.",
          microphonePermission: false,
        },
      ],
    ],
    experiments: {
      baseUrl,
      typedRoutes: true,
    },
  },
};
