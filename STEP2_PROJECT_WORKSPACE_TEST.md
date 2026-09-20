# Step 2 — Project Workspace + Advanced Tasks

This build is based on the verified Step 1 People CRM package.

## Database

No database schema changes were made in Step 2.

Do **not** run `Add-Migration` or `Update-Database` for this step.

## What changed

- Unified Project Workspace navigation: Overview / List / Board / Calendar / Members.
- Project Overview now shows task totals, in-progress, completed, overdue, members and completion percentage.
- Project Overview shows recent tasks and a recent project activity timeline.
- Project List now supports search + status + priority filters.
- Existing Kanban Board, Calendar and Members views remain in place and are connected to the workspace tabs.
- Task Details now includes management controls for editing title, description, status, priority and due date.
- Task Details now includes quick subtask creation and subtask deletion.
- Existing assignees, subtasks, comments, attachments and tags remain intact.
- Project/task/member changes now write to the existing Activity table so the Project Overview timeline has useful events.

## Test 1 — Backend build

From:

`D:\Hero MEA\CRM-System\Backend\CRM.API\CRM.API`

Run:

```powershell
dotnet clean CRM.API.csproj
dotnet build CRM.API.csproj
```

Expected: `Build succeeded`.

## Test 2 — Frontend build

From:

`D:\Hero MEA\CRM-System\Frontend`

Run:

```powershell
npm install
npm run build
```

Expected: build succeeds.

## Test 3 — Project Workspace smoke test

1. Login as Admin or Manager.
2. Open Projects and open an existing project.
3. Confirm Overview shows Total Tasks / In Progress / Completed / Overdue / Members and Project progress.
4. Switch between Overview / List / Board / Calendar / Members using the workspace tabs.
5. In List, test search, status filter and priority filter.
6. Create a task from the List page.
7. Move the task between Board columns and refresh the page; status should remain changed.
8. Open the task details page.
9. Use Edit task to change title, description, status, priority or due date; refresh and confirm persistence.
10. Quick-add a subtask, mark it complete, then delete it.
11. Add/remove an assignee, comment, tag and attachment as before.
12. Return to Project Overview. Recent Tasks should include the task and Recent Activity should show project/task changes performed after this Step 2 build was installed.

## Important

- SQL task table remains `dbo.TaskItems`.
- C# entity remains `TaskItem`.
- No WorkRequests / Knowledge Base / IT Systems modules were restored.
- No Accounting / Inventory / Payroll / ERP modules were added.
