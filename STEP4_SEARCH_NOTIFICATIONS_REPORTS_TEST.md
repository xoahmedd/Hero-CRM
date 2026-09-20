# Step 4 — Search, Notifications, Dashboard, Reports & Cleanup

## Important

- Step 4 does **not** add a new database schema change.
- Do **not** run `Add-Migration` or `Update-Database` for Step 4.
- The source includes the already-applied Step 3 migration `20260913133909_AddCRMFollowUps` so the migration history stays aligned with `CRM_DB`.

## 1) Backend build

From:

`D:\Hero MEA\CRM-System\Backend\CRM.API\CRM.API`

Run:

```powershell
dotnet clean CRM.API.csproj
dotnet build CRM.API.csproj
```

Expected: `Build succeeded`.

Then in Package Manager Console:

```powershell
Get-Migration
```

Expected: `AddCRMFollowUps` is still applied (`True`). No new Step 4 migration is required.

## 2) Frontend build

From:

`D:\Hero MEA\CRM-System\Frontend`

Run:

```powershell
npm install
npm run build
```

Expected: successful TypeScript/Vite production build.

## 3) Global Search smoke test

Use the top search bar and test one value from each category:

- Department name
- Person name/email/job title
- Project name
- Task title/project name
- Follow-up title/person/department/project

Open results and confirm navigation works.

## 4) Dashboard smoke test

Open Dashboard and confirm these populate without errors:

- Departments
- People
- Projects
- Open follow-ups
- Task totals / completion rate
- Overdue tasks
- Due-today / overdue follow-ups
- Upcoming follow-ups
- Recent activity

## 5) Automatic notifications

Test with two users if possible:

1. Assign User B to a task as Admin/Manager.
2. Sign in as User B and confirm a `Task` notification appears.
3. Add User B to a project and confirm a `Project` notification appears.
4. Create/assign a CRM follow-up owned by User B and confirm a `FollowUp` notification appears.
5. Confirm the header unread badge changes and `Mark all read` works.

## 6) Reports smoke test

Open Reports and confirm:

- Summary cards show Departments / People / Projects / Tasks / Follow-ups / Users.
- Growth chart renders.
- Task Status, Task Priority, Project Status charts render.
- Department Status and Follow-up Status render.
- Project Performance rows open their project.
- User Workload shows open / due soon / overdue task counts.

## 7) Cleanup checks

- `/requesters` redirects to `/people`.
- Swagger should no longer expose the old Requesters controller or Test controller.
- No Hero IT / IT Work Management wording should appear in the active UI.

If all seven groups pass, Step 4 is complete and the project is ready for Step 5 Final QA / Security / Deployment.
