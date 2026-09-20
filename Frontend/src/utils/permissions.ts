import type { CurrentUser } from "../types/auth";

export function hasAnyRole(
  user: CurrentUser | null | undefined,
  roles: readonly string[]
) {
  return !!user && roles.some((role) => user.roles.includes(role));
}

export const isAdmin = (user: CurrentUser | null | undefined) =>
  hasAnyRole(user, ["Admin"]);

export const isUser = (user: CurrentUser | null | undefined) =>
  hasAnyRole(user, ["User"]);

export const canManageProtectedResources = isAdmin;
export const canWorkAssignedResources = (user: CurrentUser | null | undefined) =>
  hasAnyRole(user, ["Admin", "User"]);

export function getDefaultRoute(user: CurrentUser | null | undefined) {
  if (isAdmin(user)) return "/";
  return "/tasks";
}
