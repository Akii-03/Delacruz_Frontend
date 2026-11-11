export const CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://delacruz-backend.onrender.com",
  STORAGE_KEYS: {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
  },
  ROUTES: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/dashboard",
  },
} as const;
