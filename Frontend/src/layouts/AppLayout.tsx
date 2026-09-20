import {
  Bell,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

import { useAuth } from "../providers/AuthProvider";
import GlobalSearchBox from "../components/GlobalSearchBox";
import QuickTaskModal, { openQuickTask } from "../components/QuickTaskModal";
import {
  getUnreadNotificationCount,
  NOTIFICATIONS_CHANGED_EVENT,
} from "../services/notificationService";
import {
  canManageProtectedResources,
  getDefaultRoute,
} from "../utils/permissions";

function navItemClass({ isActive }: { isActive: boolean }) {
  return [
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isManagement = canManageProtectedResources(user);

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!user) {
      setUnreadNotificationCount(0);
      return;
    }

    let cancelled = false;

    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        if (!cancelled) {
          setUnreadNotificationCount(count);
        }
      } catch {
        // The Notifications page surfaces API errors if the user opens it.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadUnreadCount();
      }
    };

    void loadUnreadCount();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, loadUnreadCount);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, loadUnreadCount);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, location.pathname]);

  useEffect(() => {
    setMobileSearchOpen(false);
    setProfileOpen(false);
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [user?.profileImage]);

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <button
            type="button"
            onClick={() => navigate(getDefaultRoute(user))}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
              H
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900">Hero CRM</div>
              <div className="text-xs text-slate-400">CRM + Work Management</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </div>

          <div className="space-y-1">
            {isManagement && (
              <>
                <NavLink to="/" end className={navItemClass}>
                  <LayoutDashboard size={18} />
                  Dashboard
                </NavLink>

                <NavLink to="/departments" className={navItemClass}>
                  <Building2 size={18} />
                  Departments
                </NavLink>

                <NavLink to="/people" className={navItemClass}>
                  <UserRound size={18} />
                  People
                </NavLink>

                <NavLink to="/projects" className={navItemClass}>
                  <FolderKanban size={18} />
                  Projects
                </NavLink>
              </>
            )}

            {!isManagement && (
              <NavLink to="/projects" className={navItemClass}>
                <FolderKanban size={18} />
                My Projects
              </NavLink>
            )}

            <NavLink to="/tasks" end className={navItemClass}>
              <CheckSquare size={18} />
              My Tasks
            </NavLink>

            <NavLink to="/calendar" className={navItemClass}>
              <CalendarDays size={18} />
              Calendar
            </NavLink>

            {isManagement && (
              <NavLink to="/follow-ups" className={navItemClass}>
                <CalendarClock size={18} />
                Follow-ups
              </NavLink>
            )}

            {isManagement && (
              <>
                <NavLink to="/users" className={navItemClass}>
                  <Users size={18} />
                  Users
                </NavLink>

                <NavLink to="/teams" className={navItemClass}>
                  <Users size={18} />
                  Teams
                </NavLink>

                <NavLink to="/reports" className={navItemClass}>
                  <ClipboardList size={18} />
                  Reports
                </NavLink>
              </>
            )}
          </div>

          <div className="my-6 border-t border-slate-200" />
          <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            System
          </div>

          <NavLink to="/settings" className={navItemClass}>
            <Settings size={18} />
            Settings
          </NavLink>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-400">Signed in as</div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-800">
              {user?.fullName ?? "User"}
            </div>
            <div className="mt-0.5 truncate text-xs text-slate-500">
              {user?.roles?.join(", ") || "User"}
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
            >
              <Menu size={21} />
            </button>

            {isManagement && (
              <div className="hidden md:block md:w-80">
                <GlobalSearchBox />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openQuickTask}
              className="hidden items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
            >
              <Plus size={17} />
              Add task
            </button>

            {isManagement && (
              <button
                type="button"
                onClick={() => setMobileSearchOpen((value) => !value)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                aria-label="Search"
                aria-expanded={mobileSearchOpen}
              >
                <Search size={19} />
              </button>
            )}

            <button
              type="button"
              onClick={openQuickTask}
              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 sm:hidden"
              aria-label="Add task"
            >
              <Plus size={19} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell size={19} />
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100"
                aria-label="Open account menu"
                aria-expanded={profileOpen}
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {user?.profileImage && !profileImageFailed ? (
                    <img
                      src={user.profileImage}
                      alt={user.fullName}
                      className="h-full w-full object-cover"
                      onError={() => setProfileImageFailed(true)}
                    />
                  ) : (
                    user?.fullName?.charAt(0).toUpperCase() ?? "U"
                  )}
                </div>

                <div className="hidden text-left sm:block">
                  <div className="max-w-32 truncate text-sm font-semibold text-slate-800">
                    {user?.fullName}
                  </div>
                  <div className="text-xs text-slate-400">
                    {user?.roles?.[0] ?? "User"}
                  </div>
                </div>
                <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <button
                    type="button"
                    onClick={() => navigate("/settings")}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {isManagement && mobileSearchOpen && (
            <div className="absolute left-0 right-0 top-16 border-b border-slate-200 bg-white p-3 shadow-lg md:hidden">
              <GlobalSearchBox autoFocus onNavigate={() => setMobileSearchOpen(false)} />
            </div>
          )}
        </header>

        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-[1680px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <QuickTaskModal />
    </div>
  );
}
