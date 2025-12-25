# Backend - Task Management (RBAC)

## Quick start

1. Create and seed the database (adjust credentials in `migrations/runMigrations.mjs` if needed):

   npm run migrate

   This will create tables (`users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `activity_logs`) and seed an `admin` role and a default admin user (`admin@example.com` / `Password123!`).

2. Start the server:

   npm run dev

   or

   npm start

3. Available admin endpoints (require proper permissions):

- GET /api/admin/users
- GET /api/admin/roles
- GET /api/admin/permissions
- GET /api/admin/activity-logs

4. Notes

- After logging in, the frontend fetches `/api/auth/me` to obtain the user's roles and permissions and stores them in `localStorage` or `sessionStorage` so UI can check permissions.
- To add initial permissions/roles modifications, edit `migrations/runMigrations.mjs`.
