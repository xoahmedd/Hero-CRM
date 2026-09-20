import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Users,
  CheckSquare,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../providers/AuthProvider";
import { useDebounce } from "../hooks/useDebounce";
import { getNotifications, search } from "../services/crmService";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/customers", label: "Customers", icon: Building2 },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const debouncedQuery = useDebounce(query);

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.userId],
    queryFn: () => getNotifications(user!.userId),
    enabled: Boolean(user),
  });

  const unreadCount = useMemo(
    () => notifications?.filter((item) => !item.isRead).length ?? 0,
    [notifications]
  );

  const { data: results } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => search(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
  });

  useEffect(() => {
    setSidebarOpen(false);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white px-4 py-6 transition lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-8 px-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Hero MEA
          </p>
          <h1 className="text-lg font-bold text-slate-900">CRM Workspace</h1>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.to === "/notifications" && unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customers, projects, tasks..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:bg-white"
              />
              {results && debouncedQuery.trim().length >= 2 && (
                <div className="absolute mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <SearchGroup
                    title="Customers"
                    items={results.customers.map((item) => ({
                      id: item.id,
                      label: item.name,
                      extra: item.company,
                      href: `/customers/${item.id}`,
                    }))}
                    onPick={() => setQuery("")}
                  />
                  <SearchGroup
                    title="Projects"
                    items={results.projects.map((item) => ({
                      id: item.id,
                      label: item.name,
                      extra: item.status,
                      href: `/projects/${item.id}`,
                    }))}
                    onPick={() => setQuery("")}
                  />
                  <SearchGroup
                    title="Tasks"
                    items={results.tasks.map((item) => ({
                      id: item.id,
                      label: item.title,
                      extra: item.status,
                      href: `/tasks/${item.id}`,
                    }))}
                    onPick={() => setQuery("")}
                  />
                </div>
              )}
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.roles.join(", ")}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SearchGroup({
  title,
  items,
  onPick,
}: {
  title: string;
  items: { id: number; label: string; extra?: string | null; href: string }[];
  onPick: () => void;
}) {
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
          onClick={() => {
            onPick();
            navigate(item.href);
          }}
        >
          <span>{item.label}</span>
          {item.extra && <span className="text-xs text-slate-400">{item.extra}</span>}
        </button>
      ))}
    </div>
  );
}
