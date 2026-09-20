# Hero CRM — Final QA, Security & Deployment

This package is the final source baseline after the five functional UAT stages passed.

## What changed in the final hardening pass

- All endpoints now require authentication by default through an ASP.NET Core fallback authorization policy.
- `POST /api/Auth/login` and `POST /api/Auth/register` are explicitly anonymous; all other controller endpoints remain protected unless explicitly configured otherwise.
- Backend self-registration now respects `AuthSettings:AllowRegistration`. It is disabled by default.
- The Login UI hides the Create Account link when registration is disabled.
- Production secrets were removed from `appsettings.json`. Production must provide the database connection string and JWT signing key from environment/configuration.
- Swagger remains Development-only.
- HSTS and the exception handler remain Production-only.
- `/health` stays anonymous so a deployment health probe can check the API.
- Removed the unused BCrypt package and an obsolete project-folder entry.
- Added source-control ignores for build output, `node_modules`, local environment files, and production secrets.

## No database migration is required

This final step contains **no EF schema change**. Do not create a migration just for this package.

The latest expected migration is:

`AddCRMFollowUps`

The existing database and all Users, Departments, People, Projects, TaskItems, Follow-ups and other data must remain untouched.

## Local final verification

Backend:

```powershell
cd "D:\Hero MEA\CRM-System\Backend\CRM.API\CRM.API"
dotnet clean CRM.API.csproj
dotnet restore CRM.API.csproj
dotnet build CRM.API.csproj
dotnet run --project CRM.API.csproj
```

Frontend:

```powershell
cd "D:\Hero MEA\CRM-System\Frontend"
npm install
npm run build
npm run dev
```

Verify:

- `/health` returns a successful response.
- Login succeeds for an active user.
- `/register` redirects to `/login` with the default configuration.
- A direct `POST /api/Auth/register` returns HTTP 403 while registration is disabled.
- An API endpoint such as `/api/people` returns 401 without a JWT and succeeds with a valid JWT.
- Admin/Manager management screens remain accessible with the expected roles.
- Employee accounts cannot access Admin/Manager-only operations.

## Production configuration

Do not put real secrets into source files. Set at minimum:

```text
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=<production SQL Server connection string>
JwtSettings__Key=<long random secret, at least 32 bytes of entropy>
JwtSettings__Issuer=CRM.API
JwtSettings__Audience=CRM.Client
JwtSettings__DurationInMinutes=60
AuthSettings__AllowRegistration=false
Cors__AllowedOrigins__0=https://crm.example.com
```

For the frontend production build, create a local `.env.production` (do not commit it) from `.env.production.example`:

```text
VITE_API_URL=/api
VITE_ALLOW_REGISTRATION=false
```

If frontend and API are hosted on different origins, set `VITE_API_URL` to the public API URL and configure the exact frontend origin in `Cors:AllowedOrigins`. Do not use a wildcard origin in production.

## Publish commands

API:

```powershell
cd "D:\Hero MEA\CRM-System\Backend\CRM.API\CRM.API"
dotnet publish CRM.API.csproj -c Release -o .\publish
```

Frontend:

```powershell
cd "D:\Hero MEA\CRM-System\Frontend"
npm ci
npm run build
```

The frontend production output is `Frontend/dist`.

## Database deployment rule

Before deploying, verify the migration history:

```powershell
Get-Migration
```

`AddCRMFollowUps` should already be applied in the database used during UAT. This final package does not require `Update-Database`.

Never drop/reset `CRM_DB` for this deployment.

## Final demo smoke flow

Use this order for the deadline demo:

1. Login and Dashboard.
2. Department -> People profile -> Notes/Tags/Timeline.
3. Project Workspace -> List/Board/Calendar -> Task details.
4. Follow-up -> Complete with outcome -> Timeline.
5. Team -> Workload.
6. Global Search.
7. Notifications.
8. Reports.

This demonstrates the intended scope: CRM + Work/Project Management, not ERP.
