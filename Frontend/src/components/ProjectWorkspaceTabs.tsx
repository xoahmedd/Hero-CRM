import {
  CalendarDays,
  FolderKanban,
  LayoutList,
  SquareKanban,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

type ProjectWorkspaceTab = "overview" | "list" | "board" | "calendar" | "members";

const tabs: Array<{
  id: ProjectWorkspaceTab;
  label: string;
  icon: typeof FolderKanban;
  path: (projectId: number) => string;
}> = [
  {
    id: "overview",
    label: "Overview",
    icon: FolderKanban,
    path: (projectId) => `/projects/${projectId}`,
  },
  {
    id: "list",
    label: "List",
    icon: LayoutList,
    path: (projectId) => `/projects/${projectId}/list`,
  },
  {
    id: "board",
    label: "Board",
    icon: SquareKanban,
    path: (projectId) => `/projects/${projectId}/board`,
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    path: (projectId) => `/projects/${projectId}/calendar`,
  },
  {
    id: "members",
    label: "Members",
    icon: Users,
    path: (projectId) => `/projects/${projectId}/members`,
  },
];

export default function ProjectWorkspaceTabs({
  projectId,
  active,
}: {
  projectId: number;
  active: ProjectWorkspaceTab;
}) {
  return (
    <div className="overflow-x-auto border-b border-slate-200">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;

          return (
            <NavLink
              key={tab.id}
              to={tab.path(projectId)}
              className={[
                "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition",
                isActive
                  ? "border-blue-600 font-semibold text-blue-600"
                  : "border-transparent font-medium text-slate-500 hover:text-slate-900",
              ].join(" ")}
            >
              <Icon size={17} />
              {tab.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
