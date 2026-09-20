# Step 3 — CRM Follow-ups + Teams Workload

This step adds a real CRM follow-up workflow and live team workload without changing the existing TaskItems model.

## Database change

This source intentionally does **not** ship a hand-written migration. Generate it locally from the verified Step 2 snapshot:

```powershell
Add-Migration AddCRMFollowUps
```

Before `Update-Database`, inspect the migration. `Up()` should create **only** `FollowUps` plus its indexes/foreign keys. It must not create/drop/alter Users, Customers, Contacts, Projects, TaskItems, OrganizationTags, ContactNotes, or ContactTagAssignments.

Expected new table: `FollowUps`.

Expected relationships:
- OwnerId -> Users (Restrict)
- ContactId -> Contacts (SetNull)
- DepartmentId -> Customers (SetNull)
- ProjectId -> Projects (SetNull)

Then apply:

```powershell
Update-Database
```

## Build tests

Backend:

```powershell
cd "D:\Hero MEA\CRM-System\Backend\CRM.API\CRM.API"
dotnet clean CRM.API.csproj
dotnet build CRM.API.csproj
```

Frontend:

```powershell
cd "D:\Hero MEA\CRM-System\Frontend"
npm install
npm run build
```

## Follow-up smoke test

1. Sign in as Admin or Manager.
2. Open **Follow-ups** from the sidebar.
3. Create a Follow-up linked to a Person. Set owner and a future due date.
4. Confirm it appears as Open.
5. Open that Person profile and click **Follow-ups**; confirm the filtered follow-up appears.
6. Complete it and enter an outcome.
7. Return to the Person profile and confirm Activity Timeline contains `Follow-up created` and `Follow-up completed`.
8. Repeat once linked to a Department or Project if desired.
9. Use Overdue / Today / Upcoming filters.

## Team workload smoke test

1. Open **Teams** and select a team with members.
2. Confirm the **Team workload** section appears.
3. Assign open tasks to team members.
4. Refresh workload and confirm Open / In Progress / Pending / Due Soon / Overdue counts update.
5. Create a new team and confirm its creator is automatically included as the first member.

## No other database changes

- C# task entity remains `TaskItem`.
- SQL task table remains `dbo.TaskItems`.
- No ERP modules are added.
- Existing Users / Departments / People / Projects / Tasks data must remain untouched.


## SQL Server cascade-path fix

The FollowUp -> Department foreign key intentionally uses `DeleteBehavior.NoAction`.
SQL Server rejects `SET NULL` on that relationship because `Customers` can already reach
`FollowUps` through `Contacts`, creating multiple cascade paths. Department deletion now
clears `FollowUp.DepartmentId` in application code before deleting the department.

If an earlier `Update-Database` attempt failed with SQL error 1785, verify that the failed
migration was not applied, then remove/regenerate the pending `AddCRMFollowUps` migration
from this fixed source before running `Update-Database` again.
