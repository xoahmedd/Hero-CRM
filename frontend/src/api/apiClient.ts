const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5285/api";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = typeof window !== "undefined" ? localStorage.getItem("hero_crm_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    let message = errorData?.message;
    if (!message && errorData?.errors) {
      if (Array.isArray(errorData.errors)) {
        message = errorData.errors.join(" ");
      } else if (typeof errorData.errors === "object") {
        message = Object.values(errorData.errors).flat().join(" ");
      }
    }
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("hero_crm_token");
      }
      if (!message) {
        message = "Session expired or invalid credentials. Please sign out and sign back in.";
      }
    } else if (!message) {
      message = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new ApiError(message, response.status, errorData);
  }

  // Handle empty 204 response
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { method: "GET", ...options });
  },

  post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { method: "DELETE", ...options });
  },
};
