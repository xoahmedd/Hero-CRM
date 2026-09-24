import { useState, useEffect, useCallback } from "react";
import type { User, Notification } from "../types";
import { notificationsApi } from "../api/services";
import { timeAgo, formatCairoTime } from "./ui";

type Page =
  | "dashboard-admin"
  | "dashboard-developer"
  | "projects"
  | "project-details"
  | "tasks"
  | "users";

interface LayoutProps {
  currentUser: User;
  currentPage: Page;
  onNavigate: (page: Page, id?: number) => void;
  children: React.ReactNode;
  onLogout: () => void;
}

const navItems = [
  {
    label: "Dashboards",
    items: [
      { id: "dashboard-admin", label: "Admin Overview", icon: "◈", roles: ["Admin"] },
      { id: "dashboard-developer", label: "My Workspace", icon: "◉", roles: ["Admin", "Developer"] },
    ],
  },
  {
    label: "Work",
    items: [
      { id: "projects", label: "Projects", icon: "▦", roles: ["Admin", "Developer"] },
      { id: "tasks", label: "Tasks", icon: "✦", roles: ["Admin", "Developer"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { id: "users", label: "Users", icon: "◔", roles: ["Admin"] },
    ],
  },
];

const notifIcons: Record<string, string> = {
  ProjectAssigned: "▦",
  TaskAssigned: "✦",
  DeadlineApproaching: "◷",
  DeadlineMissed: "⚠",
};

export default function Layout({ currentUser, currentPage, onNavigate, children, onLogout }: LayoutProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fetchNotifications = useCallback(() => {
    if (!currentUser?.id) return;
    notificationsApi
      .getNotifications(currentUser.id)
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch(() => {});
  }, [currentUser?.id]);

  useEffect(() => {
    fetchNotifications();

    // Poll every 10 seconds for real-time notification updates and badge updates
    const interval = setInterval(fetchNotifications, 10000);

    // Also listen for immediate refresh event dispatched across app actions
    const handleRefresh = () => fetchNotifications();
    window.addEventListener("refresh-notifications", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-notifications", handleRefresh);
    };
  }, [fetchNotifications, currentPage]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (currentUser?.id) {
      try {
        await notificationsApi.markAllAsRead(currentUser.id);
      } catch (err) {
        console.warn("Failed to mark all as read on server:", err);
      }
    }
  }

  async function markRead(id: number) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await notificationsApi.markAsRead(id);
    } catch (err) {
      console.warn("Failed to mark notification as read on server:", err);
    }
  }


  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        fontFamily: "var(--font-body)",
        background: "var(--color-sidebar)",
      }}
    >
      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-200"
        style={{
          width: sidebarCollapsed ? 64 : 240,
          background: "var(--color-sidebar)",
          color: "var(--color-sidebar-foreground)",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: "#1a2d5a" }}>
          {sidebarCollapsed ? (
            <div
              className="flex items-center justify-center rounded-md text-white font-black"
              style={{ width: 36, height: 36, background: "#1a3896", fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: "-0.04em" }}
            >
              H
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span
                className="font-bold text-white tracking-tight leading-tight"
                style={{ fontFamily: "var(--font-display)", fontSize: 18 }}
              >
                Hero CRM
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#4a8220", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, paddingLeft: 1 }}>
                CRM &amp; Project Platform
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((group) => {
            const visible = group.items.filter((item) => item.roles.includes(currentUser.role));
            if (!visible.length) return null;
            return (
              <div key={group.label} className="mb-4">
                {!sidebarCollapsed && (
                  <div
                    className="px-4 pb-1 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "#475569", fontFamily: "var(--font-display)" }}
                  >
                    {group.label}
                  </div>
                )}
                {visible.map((item) => {
                  const active = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id as Page)}
                      className="w-full flex items-center gap-3 px-4 py-2 transition-colors text-sm"
                      style={{
                        background: active ? "rgba(26,56,150,0.18)" : "transparent",
                        color: active ? "#7ba4ff" : "var(--color-sidebar-foreground)",
                        borderLeft: active ? "3px solid #4a8220" : "3px solid transparent",
                        fontFamily: "var(--font-body)",
                        justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle + user */}
        <div className="border-t" style={{ borderColor: "#1e293b" }}>
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="w-full flex items-center justify-center py-2 text-xs transition-colors"
            style={{ color: "#475569" }}
          >
            {sidebarCollapsed ? "▶" : "◀"}
          </button>
          <div className="flex items-center gap-3 px-4 py-4">
            <div
              className="flex items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0"
              style={{ width: 32, height: 32, background: "var(--color-primary)" }}
            >
              {currentUser.avatar}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "#f1f5f9" }}>
                  {currentUser.fullName}
                </div>
                <div className="text-xs truncate" style={{ color: "#64748b" }}>
                  {currentUser.role}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main area - floating canvas away from sidebar & page edges */}
      <div
        className="flex-1 flex flex-col min-w-0 my-2.5 md:my-3 mr-2.5 md:mr-3.5 ml-1.5 md:ml-2.5 rounded-2xl shadow-xl overflow-hidden border"
        style={{
          background: "var(--color-background)",
          borderColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-8 md:px-10 border-b flex-shrink-0 rounded-t-2xl"
          style={{ paddingTop: 16, paddingBottom: 16, background: "white", borderColor: "var(--color-border)" }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--color-foreground)" }}>
            {navItems.flatMap((g) => g.items).find((i) => i.id === currentPage)?.label ?? "Hero CRM"}
          </div>
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifs((s) => !s);
                  fetchNotifications();
                }}
                className="relative flex items-center justify-center rounded-xl transition-colors cursor-pointer"
                style={{ width: 40, height: 40, background: showNotifs ? "#f1f5f9" : "transparent" }}
                title="Notifications"
                aria-label="Notifications"
              >
                <span style={{ fontSize: 17 }}>🔔</span>
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-bold pointer-events-none z-10 shadow-sm"
                    style={{ minWidth: 18, height: 18, padding: "0 4px", fontSize: 10, background: "#ef4444", fontFamily: "var(--font-mono)" }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div
                  className="absolute right-0 top-12 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  style={{ width: 380, background: "white", border: "1px solid var(--color-border)" }}
                >
                  <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-mono">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs font-semibold cursor-pointer hover:underline"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) {
                              markRead(n.id);
                            }
                            if (n.targetType === "Project" && n.targetId) {
                              onNavigate("project-details", n.targetId);
                              setShowNotifs(false);
                            } else if (n.targetType === "Task") {
                              onNavigate("tasks");
                              setShowNotifs(false);
                            }
                          }}
                          className="flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                          style={{ background: n.isRead ? "transparent" : "#faf5ff" }}
                        >
                          <div
                            className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                            style={{ width: 32, height: 32, background: "#f1f5f9", fontSize: 13 }}
                          >
                            {notifIcons[n.type] || "✦"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium leading-snug" style={{ color: "var(--color-foreground)" }}>
                              {n.title}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                              {n.message}
                            </div>
                            <div className="text-xs mt-1 flex items-center gap-1.5 flex-wrap" style={{ color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                              <span>{timeAgo(n.createdAt)}</span>
                              {n.createdAt && <span>•</span>}
                              {n.createdAt && <span>{formatCairoTime(n.createdAt)} (Cairo)</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-1">
                            {!n.isRead ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markRead(n.id);
                                }}
                                className="w-2.5 h-2.5 rounded-full hover:scale-125 transition-transform cursor-pointer"
                                style={{ background: "var(--color-primary)" }}
                                title="Mark as read"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400">Read</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="text-sm px-4 py-2 rounded-xl font-medium transition-all shadow-xs hover:bg-slate-200 cursor-pointer"
              style={{ background: "#f1f5f9", color: "var(--color-foreground)" }}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8 md:p-10 rounded-b-2xl" style={{ background: "var(--color-background)" }}>
          {children}
        </main>
      </div>

      {/* Close notif dropdown on outside click */}
      {showNotifs && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
      )}
    </div>
  );
}
