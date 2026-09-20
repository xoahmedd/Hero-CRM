# Hero CRM — Project Team Assignment Repair

This repair intentionally changes **only** the project/team assignment compatibility layer.
It does not alter People, Follow-ups, Tasks, Reports, Departments, authentication data, or existing records.

## Why Projects / Follow-ups / Team details returned 500
The source model now contains `Project.TeamId`, but the database can still be missing `dbo.Projects.TeamId`.
Because Follow-ups and Team Details also query Project data, the same missing column can make those sections fail too.

## Apply
1. Stop Backend and Frontend.
2. Copy the `Frontend` folder from this patch over the project root (optional resilience fix only).
3. Open SSMS on `CRM_DB` and run `REPAIR_PROJECT_TEAM_SCHEMA.sql`.
4. Run `VERIFY_REPAIR.sql`. Expected:
   - `TeamId` exists and is nullable.
   - `IX_Projects_TeamId` exists.
   - `FK_Projects_Teams_TeamId` exists with `SET_NULL`.
5. Build Backend and Frontend, then restart both.

No tables are dropped, no existing column is removed, and existing Projects get `TeamId = NULL` until an Admin assigns a Team.

## Smoke test
- Projects page loads.
- Follow-ups page loads.
- Existing Team details loads.
- Admin can assign a Team to a Project.
- A task in a team-assigned Project only offers users from that Team for assignment.
