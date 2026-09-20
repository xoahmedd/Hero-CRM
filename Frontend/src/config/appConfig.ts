const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const apiBaseUrl =
  configuredApiUrl ||
  (import.meta.env.DEV
    ? "http://localhost:5244/api"
    : "/api");

const configuredRegistration =
  import.meta.env.VITE_ALLOW_REGISTRATION?.trim().toLowerCase();

export const allowRegistration = configuredRegistration !== "false";