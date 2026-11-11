import { CONFIG } from "./config";

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  if (!token || token === "undefined" || token === "null") return null;
  return token;
};

export const getUserRole = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("user_role");
};

export const setTokens = (
  accessToken?: string, 
  refreshToken?: string, 
  role?: string
): void => {
  if (typeof window === "undefined") return;

  if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  } else {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  }

  if (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") {
    localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  } else {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  }

  if (role) {
    localStorage.setItem("user_role", role);
  } else {
    localStorage.removeItem("user_role");
  }
};

export const clearTokens = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem("user_role");
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};