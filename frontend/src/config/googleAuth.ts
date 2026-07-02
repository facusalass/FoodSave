const missingClientId = "missing-google-client-id";
const defaultClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const googleAuthConfig = {
  androidClientId: androidClientId || defaultClientId || missingClientId,
  clientId: defaultClientId || missingClientId,
  iosClientId: iosClientId || defaultClientId || missingClientId,
  webClientId: webClientId || defaultClientId || missingClientId
};

export function hasGoogleClientId() {
  return Boolean(defaultClientId || androidClientId || iosClientId || webClientId);
}
