# Final Workflow Patch — Admins + Users + Teams

This patch makes only the requested workflow changes:

- Removes public self-registration / Create Account.
- Public roles are now only **Admin** and **User**.
- Old Developer accounts are treated as **User** after the next login; no role-data migration is required.
- Admin creates and manages Users from the Users screen.
- Admin creates Teams and adds Users to Teams.
- A Project can optionally be assigned to one Team.
- When a Project has a Team, task assignment is restricted to Users who belong to that Team.
- Project/Task CRM features outside this scope are left unchanged.

## Important: preserve your current migrations

This ZIP intentionally contains **no `Migrations` folder**. Apply it over your current source tree so your locally-fixed migration history is preserved.

## 1. Backend build

```powershell
cd "D:\Hero MEA\CRM-System\Backend\CRM.API\CRM.API"
dotnet clean CRM.API.csproj
dotnet build CRM.API.csproj
```

Do not continue if the build fails.

## 2. Create the only new migration

From Package Manager Console:

```powershell
Add-Migration AddProjectTeamAssignment
```

Review `Up()` before applying it. The expected schema change is only:

- Add nullable `TeamId` to `Projects`.
- Add index `IX_Projects_TeamId`.
- Add FK `Projects.TeamId -> Teams.Id`, with delete behavior `SET NULL` / equivalent.

The migration should **not** create/drop core tables and should **not** change Users, roles, departments, RequestedBy, TaskItems, or existing CRM tables.

Then:

```powershell
Update-Database
Get-Migration
```

`AddProjectTeamAssignment` should show as applied.

## 3. Frontend build

```powershell
cd "D:\Hero MEA\CRM-System\Frontend"
npm run build
```

## 4. Required sign-out/sign-in

Existing accounts that previously had the `Developer` database role are exposed as `User` by the new authentication layer. They must **log out and log in again** so their JWT contains the new `User` role claim.

## 5. Smoke test

1. Open Login: there is no Create Account link. `/register` redirects to `/login`.
2. Login as Admin -> Users: roles shown are only Admin/User. Create a new User.
3. Admin -> Teams: create a Team and add two Users.
4. Admin -> Projects: create/open a Project and select that Team in **Assigned team**.
5. Login as one Team User: the team-assigned Project appears under My Projects.
6. Login as Admin -> open a Task inside that Project: the assignee dropdown contains only Users from that Team.
7. Assign the Task to one team User.
8. Login as that User: the Task appears in My Tasks and the User can work it normally.
9. Leave another Project with no Team: Admin may assign from all active Users.

No other module behavior is intentionally changed by this patch.
