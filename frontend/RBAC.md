RBAC / User Management

This project now includes a basic Role-Based Access Control (RBAC) implementation:

- New admin pages under `/admin/*`: Users, Roles, Permissions, Activity Log.
- Frontend fetches `/api/auth/me` on login to get `roles` and `permissions` for the current user and stores them in `localStorage` / `sessionStorage`.
- Sidebar only displays the User Management section when the current user has one of the management/view permissions: `view_users`, `manage_roles`, `manage_permissions`, `view_activity_log`, `manage_users`.

Run the backend migrations (`backend` folder) with:

```
npm run migrate
```

Then start the dev server. The migration creates an `admin` role and seeds an admin user `admin@example.com` with password `Password123!`.
