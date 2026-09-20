# Standalone Tasks + Asana-style My Tasks

This upgrade makes `TaskItems.ProjectId` optional. Existing project tasks are preserved. New tasks can be standalone, and deleting a project leaves its tasks as standalone instead of deleting them.

## Included
- Optional project for TaskItem (`dbo.TaskItems.ProjectId` nullable).
- Quick Add Task from the global header and My Tasks.
- New tasks auto-assign to the creator so they immediately appear in My Tasks.
- Employees can create tasks; they can only attach them to projects they can access.
- My Tasks and Calendar support standalone tasks.
- Task Details clearly labels standalone tasks.
- Managers can attach/detach a task from a project from Task Details.
- Search and task-assignment notifications support standalone tasks.
- Project deletion uses `SET NULL`, preserving tasks.

## Migration
Included migration: `20260914120000_MakeTaskProjectOptional`.
Review the SQL before applying. It should only change `TaskItems.ProjectId` from NOT NULL to NULL and change the Project FK delete action to SET NULL.

## Smoke test
1. `dotnet build CRM.API.csproj`
2. `Get-Migration` and confirm `MakeTaskProjectOptional` is Pending.
3. Preview migration script and confirm it touches only `TaskItems.ProjectId` / `FK_TaskItems_Projects_ProjectId`.
4. `Update-Database`.
5. `npm run build`.
6. Login, click **Add task**, create without Project.
7. Confirm it appears in **My Tasks**, opens in Task Details as **Standalone task**, and appears in Calendar if it has a due date.
8. Edit it as Admin/Manager and attach a Project, then detach it again.
9. Create a normal project task and confirm project List/Board/Calendar still work.
10. Search for the standalone task and confirm result says **Standalone task**.
