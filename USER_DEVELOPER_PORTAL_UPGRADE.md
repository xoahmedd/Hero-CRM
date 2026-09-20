# User / Developer Portal Upgrade

This upgrade separates the workspace into three simple roles without department-level admin hierarchies.

## Roles and flow

### Admin
- Full workspace administration.
- Sees all incoming Task and Project requests.
- Assigns Tasks to Developers.
- Adds Developers as Project members.
- Manages Departments, People, Developers/Users, Teams, Follow-ups, Reports and Search.

### Developer
- Works on Tasks assigned to them.
- Sees Projects where they are owner/member or have assigned Tasks.
- Can update Task status/progress/details, subtasks, comments and attachments on work they can access.
- Does not manage Users or Departments.

### User
- Self-registers with Full Name, Email, Password and Department.
- Automatically receives the `User` role.
- Can submit standalone Task requests or Task requests inside their own requested Project.
- Can submit Project requests; the Department is taken from their account.
- Can track only the work they requested and add comments/attachments to their own Task requests.
- Cannot assign Developers or manage workspace administration.

## Request workflow

User -> creates Task/Project request -> Admin gets a notification -> Admin assigns Developer(s) -> Developer works on it -> User tracks status/comments.

Task requester identity is already stored in `TaskItem.CreatedById`.
Project requester identity is stored in the new nullable `Project.RequestedById`.

## Expected EF migration

Create one migration named:

`AddUserDeveloperPortal`

The generated migration should contain only these model changes plus indexes/foreign keys/seed updates:

1. Add nullable `DepartmentId` to `Users`.
   - FK to `Customers(Id)` with NO ACTION / Restrict semantics.
   - Index on `DepartmentId`.
2. Add nullable `RequestedById` to `Projects`.
   - FK to `Users(Id)` with NO ACTION / Restrict semantics.
   - Index on `RequestedById`.
3. Update seeded role ID 2:
   - `Manager` -> `Developer`
   - description -> `Developer who works on assigned tasks and projects`
4. Update seeded role ID 3:
   - `Employee` -> `User`
   - description -> `Workspace requester who can submit tasks and project requests`

Existing role assignments remain attached to the same role IDs: old Managers become Developers and old Employees become Users. Existing accounts can have a null Department until Admin edits them.

The migration must NOT recreate/drop core tables such as Users, Customers, Projects, TaskItems, Contacts or OrganizationTags.

## Smoke test after Update-Database

1. Open `/register`; create a new account and choose a Department.
2. Login with that account. It should be role `User` and land on `My Requests`.
3. User creates a standalone Task request. It appears in My Requests and initially has no assignee.
4. Admin receives a `New task request` notification, opens the Task and assigns an active Developer.
5. Developer logs in, sees the Task in My Tasks, updates status/progress, adds a comment/subtask/attachment.
6. User refreshes My Requests and can see the new status and comments but cannot execute Developer controls.
7. User creates a Project request. It is automatically linked to their registered Department and appears under My Project Requests.
8. Admin receives a `New project request` notification and adds a Developer in Project Members.
9. Developer sees the Project in My Projects and can work in List/Board/Calendar/Members according to access.
10. Admin opens Developers & Users and can promote/demote between Developer/User and set Department.
