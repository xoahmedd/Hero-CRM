import { useState } from "react";
import type { User } from "./data/mock";
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard-admin");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  function handleLogin(user: User) {
    setCurrentUser(user);
    if (user.role === "Admin") {
      setCurrentPage("dashboard-admin");
    } else if (user.role === "Developer") {
      setCurrentPage("dashboard-developer");
    } else {
      setCurrentPage("projects");
    }
  }

  function handleNavigate(page: Page, id?: number) {
    setCurrentPage(page);
    if (id !== undefined) setSelectedProjectId(id);
  }

  function handleViewProject(id: number) {
    setSelectedProjectId(id);
    setCurrentPage("project-details");
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  function renderPage() {
    switch (currentPage) {
      case "dashboard-admin":
        return <AdminDashboard />;
      case "dashboard-developer":
        return <DeveloperDashboard currentUser={currentUser!} onNavigateProject={handleViewProject} />;
      case "projects":
        return <ProjectsPage currentUser={currentUser!} onViewProject={handleViewProject} />;
      case "project-details":
        return selectedProjectId ? (
          <ProjectDetails projectId={selectedProjectId} onBack={() => setCurrentPage("projects")} />
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
      onLogout={() => setCurrentUser(null)}
    >
      {renderPage()}
    </Layout>
  );
}
