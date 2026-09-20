# Hero-CRM

## 1. Summary
**Hero-CRM** is a project and task management system built following the **Clean Architecture** pattern

---

## 2. Project Architecture & Structure

The system is architected following the **Clean Architecture (Onion Architecture)** pattern, ensuring strict separation of concerns, high testability, and independence between layers. Dependencies flow inward toward the Domain core.

### Architecture Layers
1. **Domain Layer (`backend/Domain`)**:
   * Enterprise business rules and data models with zero external dependencies.
   * Contains core entities (`Project`, `TaskItem`, `ApplicationUser`, `Comment`, `Notification`) and domain enums.
2. **Application Layer (`backend/Application`)**:
   * Application business rules and data transfer contracts.
   * Defines request/response DTOs, repository interfaces (`IGenericRepository<T>`), service contracts (`INotificationService`, `IJwtService`), and pagination abstractions.
3. **Infrastructure Layer (`backend/Infrastructure`)**:
   * Data persistence and external integrations.
   * Implements EF Core `ApplicationDbContext`, entity configurations, database migrations, generic repository implementation, database seeder (`DbSeeder`), and hosted background services (`DeadlineCheckBackgroundService`).
4. **Presentation / Web API Layer (`backend/Hero-CRM`)**:
   * RESTful HTTP entry point powered by .NET 8.
   * Houses API controllers, AutoMapper profiles, custom JSON converters, JWT authentication setup, dependency injection configuration, and `appsettings.json`.
5. **Client Application Layer (`frontend`)**:
   * Single-page application built with React 19, TypeScript, and Vite.
   * Contains typed API service clients, reusable UI components, navigation layouts, and application views.

---

### Folder & File Structure

```
projectFinal/
├── backend/
│   ├── Domain/                                 # Enterprise Business Rules & Entities
│   │   ├── Entities/
│   │   │   ├── BaseEntity.cs                   # Common entity properties (Id, CreatedAt)
│   │   │   ├── Identity/                       # ApplicationUser, ApplicationRole
│   │   │   ├── Projects/                       # Project.cs, ProjectMember.cs
│   │   │   ├── Tasks/                          # TaskItem.cs, TaskAssignee.cs
│   │   │   └── Collaborations/                 # Comment.cs, Notification.cs
│   │   └── Enums/                              # ProjectStatus, TaskItemStatus, TaskPriority, NotificationType...
│   │
│   ├── Application/                            # Application Business Rules & Abstractions
│   │   ├── Common/
│   │   │   └── Pagination.cs                   # Universal paginated result wrapper
│   │   ├── DTOs/
│   │   │   ├── Auth/                           # LoginRequest, RegisterRequest, AuthResponse
│   │   │   ├── Projects/                       # CreateProjectRequest, UpdateProjectRequest, ProjectResponse...
│   │   │   ├── Tasks/                          # CreateTaskRequest, UpdateTaskRequest, TaskResponse...
│   │   │   ├── Collaborations/                 # Comment and Notification DTOs
│   │   │   ├── Dashboard/                      # AdminDashboardResponse, DeveloperDashboardResponse...
│   │   │   ├── Report/                         # WorkspaceReportResponse, ReportTrendPoint...
│   │   │   └── Users/                          # CreateUserRequest, UpdateUserRequest, UserResponse
│   │   ├── Repos_Interfaces/
│   │   │   └── IGenericRepository.cs           # Repository abstraction contract
│   │   └── Services_Interfaces/
│   │       ├── INotificationService.cs         # In-app notification service contract
│   │       └── IJwtService.cs                  # JWT token generator contract
│   │
│   ├── Infrastructure/                         # Persistence & Infrastructure Concerns
│   │   ├── _Data/
│   │   │   ├── ApplicationDbContext.cs         # EF Core DB context & model mapping
│   │   │   ├── DbSeeder.cs                     # Auto-migrating database seeder
│   │   │   ├── Configurations/                 # Fluent API entity configurations
│   │   │   └── Migrations/                     # EF Core migration history
│   │   ├── GenericRepository/
│   │   │   └── GenericRepository.cs            # Generic repository implementation
│   │   └── Services/
│   │       ├── NotificationService.cs          # In-app notification creation & dispatching
│   │       └── DeadlineCheckBackgroundService.cs # Periodic deadline check hosted service
│   │
│   └── Hero-CRM/                               # Web API Presentation Layer
│       ├── Controllers/
│       │   ├── AuthController.cs               # Authentication & token endpoints
│       │   ├── ProjectsController.cs           # Project CRUD & status management
│       │   ├── ProjectMembersController.cs     # Project member assignment
│       │   ├── TasksController.cs              # Task CRUD, status workflow & diff sync
│       │   ├── CommentsController.cs           # Task discussion threads
│       │   ├── NotificationsController.cs      # In-app notifications
│       │   ├── DashboardController.cs          # Admin & Developer dashboard statistics
│       │   ├── ReportsController.cs            # Workspace performance reports
│       │   └── UsersController.cs              # User administration endpoints
│       ├── Mapping/
│       │   └── MappingProfiles.cs              # AutoMapper DTO-entity profiles
│       ├── Services/
│       │   └── JwtService.cs                   # JWT token generation implementation
│       ├── Converters/                         # Custom JSON converters
│       ├── Program.cs                          # Application entry point, DI & middleware
│       └── appsettings.json                    # Connection string & JWT configuration
│
└── frontend/                                   # Client Application Layer (React + Vite)
    ├── src/
    │   ├── api/
    │   │   ├── apiClient.ts                    # Axios instance with JWT interceptors
    │   │   └── services.ts                     # Strongly-typed HTTP API service functions
    │   ├── components/
    │   │   ├── ui.tsx                          # Reusable UI primitives (Badge, Card, Modal, Button)
    │   │   ├── Layout.tsx                      # Navigation bar, sidebar & notification bell
    │   │   └── ErrorBoundary.tsx               # Client error boundary container
    │   ├── pages/
    │   │   ├── AdminDashboard.tsx              # Executive KPIs & project metrics
    │   │   ├── DeveloperDashboard.tsx          # Personal workspace & active task board
    │   │   ├── ProjectsPage.tsx                # Project grid, filters & creation modal
    │   │   ├── ProjectDetails.tsx              # Project detail view with member & task tabs
    │   │   ├── TasksPage.tsx                   # Agile Kanban board & task detail drawer
    │   │   ├── UsersPage.tsx                   # Team member management
    │   │   └── LoginPage.tsx                   # User login view
    │   ├── App.tsx                             # Root component & dynamic HTML5 router
    │   ├── types.ts                            # Centralized TypeScript interfaces
    │   └── main.tsx                            # React DOM entry point
    ├── package.json
    └── vite.config.ts
```

---

## 3. What the System Does
Hero-CRM provides a centralized platform for managing projects and tracking tasks between administrators and developers:
* **Project Tracking**: Admins create and organize projects, assign developer teams, set deadlines, and monitor overall progress and milestone delivery.
* **Task Execution & Tracking**: Developers track their assigned tasks, advance work through an agile workflow, collaborate via discussion comments, and report justifications if deadlines are missed.

---

## 4. Key Features & Capabilities

* **Role-Based Access Control (RBAC)**:
  * **Admin**: Complete operational oversight; creates and manages projects, tasks, and users; assigns team members; reviews and approves finished deliverables.
  * **Developer**: Dedicated workspace showing assigned projects and tasks; advances task status to `Review`; participates in task comments.
* **Project Lifecycle & Status Synchronization**:
  * Projects have three strict states: `InProgress`, `Finished`, and `Cancelled`.
  * **Auto-Finish Sync**: When all tasks in an active project reach `Completed` or `Cancelled` (with at least one completed), the parent project automatically transitions to `Finished`. Reopening a task reverts the project back to `InProgress`.
  * **Cascading Task Cancellation**: When a project is marked `Cancelled`, all its open/active tasks (`Assigned`, `Review`) are automatically cancelled. Completed tasks remain completed.
  * **Cancelled Project Lock**: Cancelled projects are protected and will never be automatically reopened by task updates.
  * **Progress Calculation**: Cancelled tasks are excluded when calculating project completion percentage.
* **Agile Task Workflow**:
  * Tasks follow the pipeline: `Assigned` $\rightarrow$ `Review` $\rightarrow$ `Completed` (or `Cancelled`).
  * **Quality Gate**: Developers move work to `Review`, and only Admins can approve tasks to `Completed`.
  * **Smart Differential Assignee Sync**: Adding or removing task members calculates a diff so newly assigned developers receive notifications without wiping existing members or sending duplicate alerts.
* **Deadline Tracking & Delay Justifications**:
  * An automated background service (`DeadlineCheckBackgroundService`) sends 48-hour deadline warning alerts and flags overdue deliverables.
  * Overdue tasks or projects require developers to submit a formal delay reason with standardized categories (*Technical Difficulty*, *Scope Creep*, *Resource Constraints*, *External Blocker*, *Client Delay*, *Other*).
* **Collaboration & In-App Notifications**:
  * Dedicated comment threads on every task for direct technical discussions.
  * In-app notifications for project assignments, task allocations, review requests, and deadline alerts.

---

## 5. REST API Endpoints

All endpoints require JWT Bearer Authentication (`Authorization: Bearer <token>`), except public authentication endpoints.

### Authentication (`/api/Auth`)
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/Auth/login` | Public | Authenticates credentials and returns a JWT Bearer token |
| `POST` | `/api/Auth/register` | Public | Registers a new user account |
| `GET` | `/api/Auth/current-user` | Authenticated | Retrieves current authenticated user profile and roles |

### Projects (`/api/Projects`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/Projects` | Authenticated | Lists all projects with optional search, status, and priority filters |
| `GET` | `/api/Projects/{id}` | Authenticated | Retrieves project details, assigned members, and progress |
| `POST` | `/api/Projects` | Admin | Creates a new project and assigns members |
| `PUT` | `/api/Projects/{id}` | Admin | Updates project metadata, schedule, and team members |
| `PATCH` | `/api/Projects/{id}/status` | Admin | Updates project status (`InProgress`, `Finished`, `Cancelled`) |
| `DELETE` | `/api/Projects/{id}` | Admin | Deletes a project and its associated tasks |
| `PUT` | `/api/Projects/{id}/missed-reason` | Authenticated | Submits delay justification for an overdue project |

### Project Members (`/api/Projects/{projectId}/members`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/Projects/{projectId}/members` | Authenticated | Lists all developers assigned to a project |
| `POST` | `/api/Projects/{projectId}/members/{userId}` | Admin | Adds a developer as a project member |
| `DELETE` | `/api/Projects/{projectId}/members/{userId}` | Admin | Removes a developer from a project |

### Tasks (`/api/Tasks`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/Tasks` | Authenticated | Lists tasks (filtered by assignee for developers, all for admins) |
| `GET` | `/api/Tasks/{id}` | Authenticated | Retrieves single task details by ID |
| `GET` | `/api/Tasks/project/{projectId}` | Authenticated | Retrieves all tasks belonging to a specific project |
| `POST` | `/api/Tasks` | Admin | Creates a new task and assigns developers |
| `PUT` | `/api/Tasks/{id}` | Admin | Updates task details and synchronizes assignees |
| `DELETE` | `/api/Tasks/{id}` | Admin | Deletes a task by ID |
| `PATCH` | `/api/Tasks/{id}/status` | Authenticated | Updates task status (`Assigned` $\rightarrow$ `Review` by Dev; `Completed` by Admin) |
| `PUT` | `/api/Tasks/{id}/missed-reason` | Authenticated | Submits delay reason and category for an overdue task |

### Comments (`/api/Comments`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/Comments/task/{taskId}` | Authenticated | Retrieves all discussion comments for a task |
| `POST` | `/api/Comments` | Authenticated | Adds a new comment to a task thread |

### Notifications (`/api/Notifications`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/Notifications/user/{userId}` | Authenticated | Retrieves all notifications for the specified user |
| `PATCH` | `/api/Notifications/{id}/read` | Authenticated | Marks a notification as read |
| `PATCH` | `/api/Notifications/user/{userId}/read-all` | Authenticated | Marks all notifications for a user as read |

### Dashboard & Analytics (`/api/Dashboard`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/Dashboard/admin` | Admin | Admin KPIs: project metrics, task completion rates, workloads |
| `GET` | `/api/Dashboard/developer/{id}` | Authenticated | Personal workspace metrics: assigned projects, tasks, upcoming deadlines |
| `GET` | `/api/Dashboard/project/{projectId}/stats` | Authenticated | Progress percentage and task breakdown for a project |

### Reports (`/api/Reports`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/Reports/workspace` | Admin | Monthly velocity trends, completion rates, and performance leaderboard |

### Users (`/api/Users`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/Users` | Authenticated | Lists all registered team members and roles |
| `POST` | `/api/Users` | Admin | Creates a new user account with role assignment |
| `PUT` | `/api/Users/{id}` | Admin | Updates user profile, role, or active status |
| `DELETE` | `/api/Users/{id}` | Admin | Deletes a user account |
