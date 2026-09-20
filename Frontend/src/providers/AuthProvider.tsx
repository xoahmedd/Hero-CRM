import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  changePassword as changePasswordRequest,
  getCurrentUser,
  login as loginRequest,
  updateProfile as updateProfileRequest,
  type LoginRequest,
} from "../services/authService";

import type {
  AuthResponse,
  ChangePasswordRequest,
  CurrentUser,
  UpdateProfileRequest,
} from "../types/auth";

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

function toCurrentUser(response: AuthResponse): CurrentUser {
  return {
    userId: response.userId,
    fullName: response.fullName,
    email: response.email,
    profileImage: response.profileImage ?? null,
    departmentId: response.departmentId ?? null,
    departmentName: response.departmentName ?? null,
    roles: response.roles,
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token =
        localStorage.getItem("crm_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser =
          await getCurrentUser();

        localStorage.setItem(
          "crm_user",
          JSON.stringify(currentUser)
        );

        setUser(currentUser);
      } catch {
        localStorage.removeItem("crm_token");
        localStorage.removeItem("crm_user");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (
    data: LoginRequest
  ) => {
    const response: AuthResponse =
      await loginRequest(data);

    localStorage.setItem(
      "crm_token",
      response.token
    );

    const currentUser =
      await getCurrentUser();

    localStorage.setItem(
      "crm_user",
      JSON.stringify(currentUser)
    );

    setUser(currentUser);
  };

  const updateProfile = async (
    data: UpdateProfileRequest
  ) => {
    const response =
      await updateProfileRequest(data);

    const currentUser = toCurrentUser(response);

    // The backend returns a fresh JWT after a profile update so
    // the token's name/email claims stay synchronized.
    localStorage.setItem("crm_token", response.token);
    localStorage.setItem(
      "crm_user",
      JSON.stringify(currentUser)
    );

    setUser(currentUser);
  };

  const changePassword = async (
    data: ChangePasswordRequest
  ) => {
    await changePasswordRequest(data);
  };

  const logout = () => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        updateProfile,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
