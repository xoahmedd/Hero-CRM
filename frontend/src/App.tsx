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
import CustomersPage from "./pages/CustomersPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import TeamsPage from "./pages/TeamsPage";

type Page =
  | "dashboard-admin"
  | "dashboard-developer"
  | "projects"
  | "project-details"
  | "tasks"
  | "customers"
  | "reports"
  | "users"
  | "teams";

const ADMIN_ONLY_PAGES: Page[] = [
  "dashboard-admin",
  "customers",
  "reports",
  "users",
  "teams",
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard-admin");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  function handleLogin(user: User) {
    setCurrentUser(user);
    if (user.role === "Admin") {
      setCurrentPage("dashboard-admin");
    } else {
      setCurrentPage("dashboard-developer");
    }
  }

  function handleLogout() {
    authApi.logout();
    setCurrentUser(null);
    setCurrentPage("dashboard-admin");
    setSelectedProjectId(null);
  }

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
    if (currentUser && currentUser.role !== "Admin" && ADMIN_ONLY_PAGES.includes(page)) {
      setCurrentPage("dashboard-developer");
      return;
    }
    setCurrentPage(page);
    if (id !== undefined) setSelectedProjectId(id);
  }

  function handleViewProject(id: number) {
    setSelectedProjectId(id);
    setCurrentPage("project-details");
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
          <ProjectDetails projectId={selectedProjectId} currentUser={currentUser!} onBack={() => setCurrentPage("projects")} />
        ) : null;
      case "tasks":
        return <TasksPage currentUser={currentUser!} />;
      case "customers":
        return <CustomersPage />;
      case "reports":
        return <ReportsPage />;
      case "users":
        return <UsersPage />;
      case "teams":
        return <TeamsPage />;
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
      {renderPage()}
    </Layout>
  );
}
