import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { LoaderCircle } from "lucide-react";

import { useAuth } from "../providers/AuthProvider";
import {
  canManageProtectedResources,
  canWorkAssignedResources,
  getDefaultRoute,
} from "../utils/permissions";

import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import ProjectsPage from "../pages/ProjectsPage";
import DepartmentsPage from "../pages/DepartmentsPage";
import DepartmentFormPage from "../pages/DepartmentFormPage";
import DepartmentDetailsPage from "../pages/DepartmentDetailsPage";
import PeoplePage from "../pages/PeoplePage";
import PersonDetailsPage from "../pages/PersonDetailsPage";
import CreateProjectPage from "../pages/CreateProjectPage";
import ProjectDetailsPage from "../pages/ProjectDetailsPage";
import ProjectTaskListPage from "../pages/ProjectTaskListPage";
import ProjectBoardPage from "../pages/ProjectBoardPage";
import TaskDetailsPage from "../pages/TaskDetailsPage";
import ProjectCalendarPage from "../pages/ProjectCalendarPage";
import ProjectMembersPage from "../pages/ProjectMembersPage";
import TeamsPage from "../pages/TeamsPage";
import UsersPage from "../pages/UsersPage";
import TeamDetailsPage from "../pages/TeamDetailsPage";
import NotificationsPage from "../pages/NotificationsPage";
import MyTasksPage from "../pages/MyTasksPage";
import CalendarPage from "../pages/CalendarPage";
import FollowUpsPage from "../pages/FollowUpsPage";
import ReportsPage from "../pages/ReportsPage";
import SearchPage from "../pages/SearchPage";
import SettingsPage from "../pages/SettingsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-sm text-slate-500"
      >
        <LoaderCircle
          size={26}
          className="animate-spin text-blue-600"
          aria-hidden="true"
        />
        Loading your workspace...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function ManagementRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!canManageProtectedResources(user)) {
    return <Navigate to="/tasks" replace />;
  }

  return children;
}


function WorkRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!canWorkAssignedResources(user)) return <Navigate to="/tasks" replace />;
  return children;
}

function LegacyDepartmentRoute({ edit = false }: { edit?: boolean }) {
  const { id } = useParams();
  return (
    <Navigate
      to={id ? `/departments/${id}${edit ? "/edit" : ""}` : "/departments"}
      replace
    />
  );
}

function HomeRoute() {
  const { user } = useAuth();

  if (!canManageProtectedResources(user)) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  return <DashboardPage />;
}

const management = (element: React.ReactNode) => (
  <ManagementRoute>{element}</ManagementRoute>
);
const work = (element: React.ReactNode) => <WorkRoute>{element}</WorkRoute>;

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomeRoute />} />

          <Route path="/departments" element={management(<DepartmentsPage />)} />
          <Route path="/departments/new" element={management(<DepartmentFormPage />)} />
          <Route path="/departments/:id" element={management(<DepartmentDetailsPage />)} />
          <Route path="/departments/:id/edit" element={management(<DepartmentFormPage />)} />
          <Route path="/people" element={management(<PeoplePage />)} />
          <Route path="/people/:id" element={management(<PersonDetailsPage />)} />

          {/* Compatibility redirects from the earlier CRM/customer terminology. */}
          <Route path="/organizations" element={<Navigate to="/departments" replace />} />
          <Route path="/organizations/new" element={<Navigate to="/departments/new" replace />} />
          <Route path="/organizations/:id" element={<LegacyDepartmentRoute />} />
          <Route path="/organizations/:id/edit" element={<LegacyDepartmentRoute edit />} />
          <Route path="/requesters" element={<Navigate to="/people" replace />} />
          <Route path="/customers" element={<Navigate to="/departments" replace />} />
          <Route path="/customers/new" element={<Navigate to="/departments/new" replace />} />
          <Route path="/customers/:id" element={<LegacyDepartmentRoute />} />
          <Route path="/customers/:id/edit" element={<LegacyDepartmentRoute edit />} />

          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/new" element={management(<CreateProjectPage />)} />
          <Route path="/projects/:id" element={<ProjectDetailsPage />} />
          <Route path="/projects/:id/list" element={work(<ProjectTaskListPage />)} />
          <Route path="/projects/:id/board" element={work(<ProjectBoardPage />)} />
          <Route path="/projects/:id/calendar" element={work(<ProjectCalendarPage />)} />
          <Route path="/projects/:id/members" element={work(<ProjectMembersPage />)} />

          <Route path="/tasks" element={<MyTasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/follow-ups" element={<FollowUpsPage />} />

          <Route path="/users" element={management(<UsersPage />)} />
          <Route path="/developers" element={<Navigate to="/users" replace />} />
          <Route path="/teams" element={management(<TeamsPage />)} />
          <Route path="/teams/:id" element={management(<TeamDetailsPage />)} />
          <Route path="/reports" element={management(<ReportsPage />)} />
          <Route path="/search" element={management(<SearchPage />)} />

          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
