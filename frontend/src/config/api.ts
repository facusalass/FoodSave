import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = "4000";
const LOCAL_API_URL = `http://localhost:${API_PORT}`;
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = getApiBaseUrl();

if (__DEV__) {
  console.log(`[FoodSave] API_BASE_URL: ${API_BASE_URL}`);
}

function getApiBaseUrl() {
  if (configuredApiUrl && !shouldUseLanFallback(configuredApiUrl)) {
    return configuredApiUrl;
  }

  return getDefaultApiUrl();
}

function getDefaultApiUrl() {
  if (Platform.OS === "web") {
    return LOCAL_API_URL;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.replace(/^https?:\/\//, "").split(":")[0];

  if (host) {
    return `http://${host}:${API_PORT}`;
  }

  return LOCAL_API_URL;
}

function shouldUseLanFallback(apiUrl: string) {
  return (
    Platform.OS !== "web" &&
    (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1"))
  );
}
