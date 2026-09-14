# Hero CRM & Project Management — Frontend Specification

This document provides a comprehensive, production-ready specification for building the Frontend interface of **Hero CRM**. It details all pages, UI components, state management rules, API endpoint integrations, request/response DTO schemas, and role-based user flows.

---

## 1. Global Architecture & API Standards

### Base URL & Environment
* **Base API Endpoint**: `https://localhost:7198/api` (or configured environment URL)
* **Content Type**: `application/json` (except file uploads using `multipart/form-data`)
* **Headers**:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```

### Universal Pagination Pattern
All paginated GET endpoints return responses structured as follows:
```typescript
interface Pagination<T> {
  pageIndex: number;
  pageSize: number;
  count: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: T[];
}
```

### Role-Based Access Control (RBAC)
The UI dynamically adapts based on user roles and permissions:
1. **Admin / System Manager**: Access to Executive Dashboard, User/Team Management, Direct Project Creation, Department Request Approval/Rejection, Workspace Reports.
2. **Lead Developer / Developer**: Access to Developer Dashboard, My Tasks, Assigned Projects, Task Status Updates, Subtask Checklists, Submitting Delay Justifications.
3. **Department User**: Access to Submit Project Proposals (`POST /api/Projects/request`) and viewing status of their department's submitted projects.

---

## 2. Page Specifications & Endpoints

---

### Page 1: Authentication (`/login`)
A modern, split-screen authentication view for system access.

#### UI Components
* **Login Card**: Email & Password inputs with "Remember Me" toggle.
* **Form Validation**: Email format validation, required password fields.
* **Error Banner**: Toast or alert banner for invalid credentials.

#### API Integrations
* **Login Request**: `POST /api/Auth/login`
  * **Payload**:
    ```json
    {
      "email": "admin@herocrm.com",
      "password": "Password123!"
    }
    ```
  * **Response**:
    ```json
    {
      "token": "eyJhbGciOi...",
      "userId": 1,
      "fullName": "Admin User",
      "email": "admin@herocrm.com",
      "roles": ["Admin"]
    }
    ```

---

### Page 2: Executive Admin Dashboard (`/dashboard/admin`)
High-level operational overview for System Administrators and Executives.

#### UI Layout & Widgets
1. **KPI Metric Cards**:
   * Total Projects, Working Projects, Finished Projects, Overdue Projects.
   * Total Tasks, Completed Tasks, Pending Tasks, Overdue Tasks.
   * Total Active Developers.
2. **Department Request Distribution Chart**: Donut chart displaying submitted project counts grouped by requesting department.
3. **Developer Workloads Table**:
   * Columns: Developer Name, Active Projects Count, Active Tasks Count.
4. **Overdue Items Needing Reason Table**:
   * Alert banner and list of projects/tasks past deadline missing a justification.
   * Action button: "Request Justification" or view submitted reason.
5. **Recent Projects Table**: Quick access list of 5 most recently created projects.

#### API Integration
* **Fetch Admin Dashboard Data**: `GET /api/Dashboard/admin`
  * **Response Schema**:
    ```json
    {
      "totalProjects": 24,
      "pendingProjects": 3,
      "workingProjects": 15,
      "finishedProjects": 4,
      "overdueProjects": 2,
      "totalTasks": 120,
      "completedTasks": 80,
      "pendingTasks": 35,
      "overdueTasks": 5,
      "totalActiveDevelopers": 8,
      "departmentRequests": [
        { "departmentName": "HR", "projectCount": 5 },
        { "departmentName": "Marketing", "projectCount": 3 }
      ],
      "developerWorkloads": [
        { "developerId": 2, "developerName": "John Doe", "activeProjectsCount": 3, "activeTasksCount": 8 }
      ],
      "overdueItemsNeedingReason": [
        {
          "itemType": "Project",
          "id": 10,
          "title": "Portal Redesign",
          "dueDate": "2026-09-01T00:00:00Z",
          "assignedUserId": 2,
          "assignedUserName": "John Doe",
          "requestingDepartment": "IT",
          "missedDeadlineReason": null,
          "reasonCategory": null
        }
      ],
      "recentProjects": [ /* List of ProjectResponse */ ]
    }
    ```

---

### Page 3: Developer Dashboard (`/dashboard/developer`)
Personalized workspace for Developers and Project Owners.

#### UI Layout & Widgets
1. **Personal Summary Cards**: Assigned Projects, Active Tasks, Completed Tasks, Overdue Tasks, Unread Notifications Count.
2. **Pending Reason Submissions Alert Banner**: Appears prominently if the developer has overdue tasks/projects without submitted delay justifications. Click opens **Submit Reason Modal**.
3. **Upcoming Tasks List**: Tasks assigned to the user ordered chronologically by due date with status badges (`Todo`, `InProgress`, `Review`).
4. **Assigned Projects Cards**: Project cards showing progress bars, priority badges, and due dates.

#### API Integration
* **Fetch Developer Dashboard**: `GET /api/Dashboard/developer/{userId}`
  * **Response Schema**:
    ```json
    {
      "userId": 2,
      "developerName": "John Doe",
      "assignedProjectsCount": 4,
      "activeTasksCount": 6,
      "completedTasksCount": 14,
      "overdueTasksCount": 1,
      "unreadNotificationsCount": 3,
      "assignedProjects": [ /* ProjectResponse[] */ ],
      "upcomingTasks": [ /* TaskResponse[] */ ],
      "pendingReasonSubmissions": [ /* OverdueItemSummary[] */ ]
    }
    ```

---

### Page 4: Project Management & Requests Center (`/projects`)
Central hub for managing ongoing projects and reviewing department proposals.

#### UI Layout & Tabs
* **Tab 1: Active & Managed Projects**:
  * Search input, Status filter (`Planning`, `Working`, `Overdue`, `Finished`), Priority filter.
  * Project grid/table displaying Name, Owner, Customer, Due Date, Status badge, and Progress %.
  * Header Action: **"+ Create Project"** button (Opens Direct Admin Creation Modal).
* **Tab 2: Department Requests Center** (Admin Only):
  * Filterable list of projects with status `Submitted`.
  * Actions per request: **"Approve"** (Opens Approval Modal) or **"Reject"** (Opens Rejection Modal).
* **Header Action: "Submit Department Request"**: Allows department users to propose new projects.

#### Modal Windows & Forms

##### Modal A: Direct Project Creation (Admin)
* **Endpoint**: `POST /api/Projects`
* **Form Payload**:
  ```json
  {
    "name": "E-Commerce Upgrade",
    "description": "Upgrading checkout pipeline",
    "status": "Working",
    "priority": "High",
    "startDate": "2026-09-15T00:00:00Z",
    "dueDate": "2026-10-30T00:00:00Z",
    "ownerId": 3,
    "customerId": 1,
    "requestingDepartment": "Sales"
  }
  ```

##### Modal B: Department Project Request Proposal
* **Endpoint**: `POST /api/Projects/request`
* **Form Payload**:
  ```json
  {
    "name": "HR Onboarding Portal",
    "description": "Automated workflow for new hires",
    "requestingDepartment": "Human Resources",
    "requestedBy": "Sarah Jenkins",
    "businessJustification": "Reduce onboarding processing time by 50%",
    "targetDeadline": "2026-11-15T00:00:00Z",
    "priority": "Medium"
  }
  ```

##### Modal C: Approve Project Request (Admin)
* **Endpoint**: `PATCH /api/Projects/{id}/approve`
* **Form Payload**:
  ```json
  {
    "ownerId": 2,
    "startDate": "2026-09-20T00:00:00Z",
    "dueDate": "2026-11-01T00:00:00Z",
    "priority": "High"
  }
  ```

##### Modal D: Reject Project Request (Admin)
* **Endpoint**: `PATCH /api/Projects/{id}/reject`
* **Form Payload**:
  ```json
  {
    "rejectionReason": "Budget constraints for Q4."
  }
  ```

##### Modal E: Submit Missed Deadline Reason
* **Endpoint**: `PUT /api/Projects/{id}/missed-reason`
* **Form Payload**:
  ```json
  {
    "reason": "Unforeseen third-party API integration delays.",
    "category": "Third-Party Blocker"
  }
  ```
  *(Categories dropdown options: `Resource Constraints`, `Scope Creep`, `Third-Party Blocker`, `Technical Difficulty`, `Client Delay`, `Other`)*

---

### Page 5: Project Details Workspace (`/projects/:id`)
Comprehensive view for a single project.

#### UI Sections
1. **Project Header**: Title, Status Badge, Priority, Lead Developer, Customer Name, Requesting Department, Start & Due Dates.
2. **Project Metrics Widget**: Task completion rate (%), Count of `Todo`, `InProgress`, `Completed` tasks. (`GET /api/Dashboard/project/{id}`).
3. **Tasks Kanban / List View**: Grouped by task status (`Todo`, `InProgress`, `Review`, `Completed`). Allows quick task status updates.
4. **Project Members Tab**: Team members involved in the project.
5. **Overdue Warning Banner**: Displays `MissedDeadlineReason` and `ReasonCategory` if the project is delayed.

#### API Integrations
* **Fetch Project Info**: `GET /api/Projects/{id}`
* **Fetch Project Dashboard Metrics**: `GET /api/Dashboard/project/{id}`
* **Fetch Project Tasks**: `GET /api/Tasks/project/{id}`

---

### Page 6: Task Management & Kanban Board (`/tasks`)
Global task overview across all projects or filtered by assigned user.

#### UI Views
* **Tab 1: My Tasks** (`GET /api/Tasks/my`): Displays tasks assigned to the logged-in user.
* **Tab 2: All Tasks** (`GET /api/Tasks`): Filterable by Search string, Status (`Todo`, `InProgress`, `Review`, `Completed`, `Cancelled`), Priority (`Low`, `Medium`, `High`, `Urgent`), and Project.
* **Kanban Board View**: Drag-and-drop or select menu to move tasks across statuses.

#### Key API Calls
* **Create Task**: `POST /api/Tasks`
  * **Payload**:
    ```json
    {
      "title": "Build Auth Middleware",
      "description": "Implement JWT validation middleware",
      "status": "Todo",
      "priority": "High",
      "projectId": 1,
      "createdById": 1,
      "dueDate": "2026-09-25T00:00:00Z"
    }
    ```
* **Update Task Status**: `PATCH /api/Tasks/{id}/status?status=InProgress`
* **Update Task Priority**: `PATCH /api/Tasks/{id}/priority?priority=Urgent`
* **Assign User to Task**: `POST /api/Tasks/{taskId}/assignees/{userId}`
* **Remove User from Task**: `DELETE /api/Tasks/{taskId}/assignees/{userId}`
* **Submit Missed Task Deadline Reason**: `PUT /api/Tasks/{id}/missed-reason`

---

### Page 7: Task Details Drawer / Modal
Deep dive interface for task discussions, subtasks, attachments, and audit history.

#### UI Components
1. **Subtasks Checklist**:
   * Add new subtask (`POST /api/SubTasks`).
   * Toggle completion checkmark (`PATCH /api/SubTasks/{id}/toggle`).
   * Delete subtask (`DELETE /api/SubTasks/{id}`).
2. **Discussion Comments**:
   * Comment feed with author profile image, name, timestamp.
   * Add comment textarea (`POST /api/Comments`).
   * Delete comment button (`DELETE /api/Comments/{id}`).
3. **File Attachments**:
   * File list with download button and file size.
   * Drag-and-drop file uploader (`POST /api/Attachments/upload`).
4. **Activity Audit Log**:
   * Timeline showing changes (e.g., "John updated status to InProgress"). (`GET /api/Activities/task/{taskId}`).

---

### Page 8: Customer Management / CRM (`/customers`)
Manage business clients, leads, and associated projects.

#### UI Components
* **Customer Data Table**: Columns for Name, Company, Email, Phone, Address, Status (`Lead`, `Active`, `Inactive`, `Archived`), and Actions.
* **Filter & Search Bar**: Real-time name/company search and status filter dropdown.
* **Create/Edit Customer Modal**: Input fields for contact details and internal notes.
* **Customer Projects Drawer**: Side drawer showing projects associated with a specific customer (`GET /api/Projects/customer/{customerId}`).

#### API Calls
* **Fetch Customers**: `GET /api/Customers?search={s}&status={st}&pageIndex=1&pageSize=20`
* **Create Customer**: `POST /api/Customers`
* **Update Customer**: `PUT /api/Customers/{id}`
* **Delete Customer**: `DELETE /api/Customers/{id}`

---

### Page 9: Analytics & Workspace Reports (`/reports`)
Interactive graphical dashboard for enterprise business intelligence.

#### UI Widgets & Controls
1. **Time Window Selector**: Dropdown selector for report timeframe (Options: `3 Months`, `6 Months`, `12 Months`). Default: `6`.
2. **Executive Summary Cards**:
   * Total Customers, Total Projects, Active Projects.
   * Total Tasks, Completed Tasks, Overdue Tasks, Task Completion Rate (%).
3. **Distribution Charts**:
   * Task Status Breakdown (Pie/Donut Chart).
   * Task Priority Breakdown (Bar Chart).
   * Project Status Breakdown (Pie/Donut Chart).
   * Customer Status Breakdown (Bar Chart).
4. **Monthly Growth & Activity Trend**: Multi-line or stacked bar chart illustrating `TasksCreated`, `ProjectsCreated`, and `CustomersCreated` per month.
5. **Project Performance Leaderboard Table**:
   * Columns: Project Name, Status, Total Tasks, Completed Tasks, Overdue Tasks, Completion Rate (Progress bar %).

#### API Call
* **Fetch Workspace Report**: `GET /api/Reports/workspace?months=6`
  * **Response Schema**:
    ```json
    {
      "generatedAt": "2026-09-12T19:00:00Z",
      "months": 6,
      "summary": {
        "totalCustomers": 15,
        "totalProjects": 8,
        "activeProjects": 5,
        "totalTasks": 45,
        "completedTasks": 30,
        "pendingTasks": 12,
        "overdueTasks": 3,
        "totalUsers": 10,
        "taskCompletionRate": 66.7
      },
      "taskStatus": [ { "name": "Completed", "count": 30 }, { "name": "InProgress", "count": 12 } ],
      "taskPriority": [ { "name": "High", "count": 15 }, { "name": "Medium", "count": 20 } ],
      "projectStatus": [ { "name": "Working", "count": 5 }, { "name": "Finished", "count": 2 } ],
      "customerStatus": [ { "name": "Active", "count": 10 }, { "name": "Lead", "count": 5 } ],
      "activityTrend": [
        { "period": "2026-04", "label": "Apr 2026", "tasksCreated": 8, "projectsCreated": 1, "customersCreated": 2 }
      ],
      "projectPerformance": [
        { "projectId": 1, "projectName": "CRM Portal", "status": "Working", "totalTasks": 20, "completedTasks": 15, "overdueTasks": 1, "completionRate": 75.0 }
      ]
    }
    ```

---

### Page 10: User & Team Administration (`/users`, `/teams`)
Administrative controls for personnel and organizational structure.

#### UI Controls
* **Users Page (`/users`)**:
  * User grid with profile image avatars, Full Name, Email, Creation Date, and Active/Inactive toggle switch.
  * **Create User Modal**: Name, Email, Password, Profile Image URL.
* **Teams Page (`/teams`)**:
  * Team cards listing Team Name, Description, and Member count.
  * **Manage Members Drawer**: Add/remove developers to teams (`POST /api/Teams/{teamId}/members/{userId}`).

---

### Global Header Component: Notification Center
Persistent top-bar notification center accessible from any page.

#### UI Components
* **Bell Icon Badge**: Displays real-time count of unread notifications.
* **Notification Dropdown Menu**:
  * Scrollable list showing notification title, message, time ago, and type icon (`ProjectAssigned`, `TaskAssigned`, `DeadlineApproaching`, `DeadlineMissed`).
  * Click on item navigates directly to target project/task page and marks as read.
* **Actions**: "Mark all as read" button.

#### API Calls
* **Fetch Notifications**: `GET /api/Notifications?unreadOnly=false`
* **Fetch Unread Count**: `GET /api/Notifications/unread-count`
* **Mark Single Notification as Read**: `PUT /api/Notifications/{id}/read`
* **Mark All Notifications as Read**: `PUT /api/Notifications/read-all`

---

## 3. Recommended Frontend State Management & Routing Map

### Suggested Route Table

| Path | Page Component | Allowed Roles |
| :--- | :--- | :--- |
| `/login` | `LoginPage` | Public |
| `/dashboard/admin` | `AdminDashboardPage` | Admin, Manager |
| `/dashboard/developer` | `DeveloperDashboardPage` | Developer, Admin |
| `/projects` | `ProjectsListPage` | All Users |
| `/projects/requests` | `DepartmentRequestsPage` | Admin |
| `/projects/:id` | `ProjectDetailsPage` | All Users |
| `/tasks` | `TasksKanbanPage` | All Users |
| `/customers` | `CustomersListPage` | Admin, Sales, Manager |
| `/reports` | `ReportsAnalyticsPage` | Admin, Manager |
| `/users` | `UsersManagementPage` | Admin |
| `/teams` | `TeamsManagementPage` | Admin, Manager |

### HTTP Status Code Handling
* `200 OK / 201 Created`: Success notification toast + state update.
* `400 Bad Request`: Display validation error messages next to form fields or in error banner.
* `401 Unauthorized`: Clear stored token and redirect user to `/login`.
* `403 Forbidden`: Show "Access Denied" view or redirect to default dashboard.
* `404 Not Found`: Display "Item Not Found" empty state illustration.
* `409 Conflict`: Show conflict alert toast (e.g., "Email already registered").
