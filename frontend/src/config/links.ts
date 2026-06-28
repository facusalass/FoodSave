declare const process: {
  env?: {
    EXPO_PUBLIC_LANDING_URL?: string;
  };
};

const DEFAULT_LANDING_URL =
  "https://foodsave-bhhce0cnhkfmdsff.chilecentral-01.azurewebsites.net/";

export const LANDING_URL =
  process.env?.EXPO_PUBLIC_LANDING_URL?.trim() || DEFAULT_LANDING_URL;

export const SUPPORT_EMAIL = "soporte@foodsave.app";
