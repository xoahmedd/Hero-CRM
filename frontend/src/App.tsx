import { useState, useEffect } from "react";
import type { User } from "./data/mock";
import { authApi } from "./api/services";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetails from "./pages/ProjectDetails";
import TasksPage from "./pages/TasksPage";
import UsersPage from "./pages/UsersPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

type Page =
  | "dashboard-admin"
  | "dashboard-developer"
  | "projects"
  | "project-details"
  | "tasks"
  | "users";

const ADMIN_ONLY_PAGES: Page[] = [
  "dashboard-admin",
  "users",
];

function pageToPath(page: Page, projectId?: number | null): string {
  switch (page) {
    case "dashboard-admin":
      return "/dashboard";
    case "dashboard-developer":
      return "/workspace";
    case "projects":
      return "/projects";
    case "project-details":
      return projectId ? `/projects/${projectId}` : "/projects";
    case "tasks":
      return "/tasks";
    case "users":
      return "/users";
    default:
      return "/";
  }
}

function pathToPageState(userRole?: string): { page: Page; projectId: number | null } {
  if (typeof window === "undefined") {
    return { page: "dashboard-admin", projectId: null };
  }

  // Support both hash routing (e.g. #/projects/5) and clean path routing (/projects/5)
  let raw = window.location.hash.replace(/^#\/?/, "") || window.location.pathname;
  if (!raw.startsWith("/")) raw = "/" + raw;
  raw = raw.replace(/\/+$/, "") || "/";

  // Match /projects/:id
  const projectMatch = raw.match(/^\/projects\/(\d+)$/i);
  if (projectMatch) {
    return { page: "project-details", projectId: parseInt(projectMatch[1], 10) };
  }

  const lower = raw.toLowerCase();
  if (lower === "/projects") return { page: "projects", projectId: null };
  if (lower === "/tasks") return { page: "tasks", projectId: null };
  if (lower === "/users") return { page: "users", projectId: null };
  if (lower === "/workspace") return { page: "dashboard-developer", projectId: null };
  if (lower === "/dashboard" || lower === "/") {
    const defaultPage: Page = userRole === "Admin" ? "dashboard-admin" : "dashboard-developer";
    return { page: defaultPage, projectId: null };
  }

  const defaultPage: Page = userRole === "Admin" ? "dashboard-admin" : "dashboard-developer";
  return { page: defaultPage, projectId: null };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(() => pathToPageState().page);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => pathToPageState().projectId);
  const [isInitializing, setIsInitializing] = useState(true);

  function resolvePageForRole(page: Page, role?: string): Page {
    if (role !== "Admin" && ADMIN_ONLY_PAGES.includes(page)) {
      return "dashboard-developer";
    }
    return page;
  }

  function navigateTo(page: Page, id?: number | null, replace = false) {
    const resolvedPage = currentUser ? resolvePageForRole(page, currentUser.role) : page;
    const targetId = id !== undefined ? id : (resolvedPage === "project-details" ? selectedProjectId : null);

    setCurrentPage(resolvedPage);
    setSelectedProjectId(targetId);

    const targetUrl = pageToPath(resolvedPage, targetId);
    if (window.location.pathname !== targetUrl && window.location.hash !== `#${targetUrl}`) {
      if (replace) {
        window.history.replaceState({ page: resolvedPage, projectId: targetId }, "", targetUrl);
      } else {
        window.history.pushState({ page: resolvedPage, projectId: targetId }, "", targetUrl);
      }
    }
  }

  function handleLogin(user: User) {
    setCurrentUser(user);
    const fromUrl = pathToPageState(user.role);
    const safePage = resolvePageForRole(fromUrl.page, user.role);

    setCurrentPage(safePage);
    setSelectedProjectId(fromUrl.projectId);

    const canonicalPath = pageToPath(safePage, fromUrl.projectId);
    window.history.replaceState({ page: safePage, projectId: fromUrl.projectId }, "", canonicalPath);
  }

  function handleLogout() {
    authApi.logout();
    setCurrentUser(null);
    setCurrentPage("dashboard-admin");
    setSelectedProjectId(null);
    window.history.replaceState(null, "", "/");
  }

  // Handle browser Back / Forward buttons (popstate)
  useEffect(() => {
    function handlePopState() {
      const state = pathToPageState(currentUser?.role);
      const safePage = currentUser ? resolvePageForRole(state.page, currentUser.role) : state.page;
      setCurrentPage(safePage);
      setSelectedProjectId(state.projectId);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentUser]);

  useEffect(() => {
    const token = localStorage.getItem("hero_crm_token");
    if (token) {
      authApi
        .getCurrentUser()
        .then((user) => {
          handleLogin(user);
        })
        .catch(() => {
          authApi.logout();
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }
  }, []);

  function handleNavigate(page: Page, id?: number) {
    navigateTo(page, id ?? null);
  }

  function handleViewProject(id: number) {
    navigateTo("project-details", id);
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1b3e" }}>
        <div className="text-white text-sm opacity-80">Loading workspace…</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  function renderPage() {
    // Role guard: non-admins cannot access admin pages
    if (currentUser && currentUser.role !== "Admin" && ADMIN_ONLY_PAGES.includes(currentPage)) {
      return <DeveloperDashboard currentUser={currentUser} onNavigateProject={handleViewProject} />;
    }

    switch (currentPage) {
      case "dashboard-admin":
        return <AdminDashboard />;
      case "dashboard-developer":
        return <DeveloperDashboard currentUser={currentUser!} onNavigateProject={handleViewProject} />;
      case "projects":
        return <ProjectsPage currentUser={currentUser!} onViewProject={handleViewProject} />;
      case "project-details":
        return selectedProjectId ? (
          <ProjectDetails projectId={selectedProjectId} currentUser={currentUser!} onBack={() => navigateTo("projects", null)} />
        ) : null;
      case "tasks":
        return <TasksPage currentUser={currentUser!} />;
      case "users":
        return <UsersPage currentUser={currentUser!} />;
      default:
        return null;
    }
  }

  return (
    <Layout
      currentUser={currentUser}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      <ErrorBoundary onReset={() => navigateTo("projects", null)}>
        {renderPage()}
      </ErrorBoundary>
    </Layout>
  );
}
