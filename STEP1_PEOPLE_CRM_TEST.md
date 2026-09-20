# Step 1 - People CRM Complete

This build finishes the People/Contacts CRM layer without changing the database schema beyond the already-applied `AddPeopleContactsCRM` migration.

## What changed

- Canonical People API under `/api/people`.
- Person CRUD with Department validation and one-primary-contact-per-department behavior.
- Person notes, person-scoped tags, timeline, and related projects.
- Activity logging for person/profile/note/tag changes.
- New People list and Person profile pages.
- Department details now use the People API instead of the legacy Requesters API.
- `/requesters` redirects to `/people`; legacy Requesters API remains hidden for compatibility.
- Main branding/navigation now says Hero CRM / CRM + Work Management.

## Important

Do not create a new migration for this step. The required tables (`ContactNotes`, `ContactTagAssignments`) are already present from `AddPeopleContactsCRM`.

## Quick test

1. Backend: `dotnet build CRM.API.csproj` -> must succeed.
2. Frontend: `npm run build` -> must succeed.
3. Login as Admin/Manager.
4. Open **People** -> existing Department contacts should appear.
5. Add a person -> open their profile.
6. Edit the person and mark them Primary; setting another person in the same Department as Primary must unset the first.
7. Add and remove a person tag.
8. Add and delete a CRM note.
9. Confirm timeline contains Person created/updated and note/tag activity.
10. Confirm Related Projects matches the person's Department projects.
11. Open a Department and add/edit/delete a person from the People card.
12. `/requesters` should redirect to `/people`.

If these pass, Step 1 is complete and the next package is Step 2: Project Workspace + Advanced Tasks.
