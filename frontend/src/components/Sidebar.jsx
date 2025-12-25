import React from "react";
import { getCurrentUser } from '../utils/permissions';
import { hasAnyPermission } from '../utils/permissions';

const Sidebar = () => {
  const user = getCurrentUser();
  const canSeeUserMgmt = hasAnyPermission(user, ['view_users','manage_roles','manage_permissions','view_activity_log','manage_users']);

  return (
    <div className="w-64 bg-blue-900 text-white min-h-screen p-5">
      <h1 className="text-2xl font-bold mb-10">TaskManager</h1>
      <ul>
        <li className="mb-5 hover:bg-blue-700 p-2 rounded"><a href="/dashboard">Dashboard</a></li>
        <li className="mb-5 hover:bg-blue-700 p-2 rounded"><a href="/tasks">Tasks</a></li>

        {canSeeUserMgmt && (
          <>
            <li className="mt-6 mb-2 uppercase text-xs text-blue-200">User Management</li>
            <li className="mb-2 hover:bg-blue-700 p-2 rounded pl-6"><a href="/admin/users">Users</a></li>
            <li className="mb-2 hover:bg-blue-700 p-2 rounded pl-6"><a href="/admin/roles">Roles</a></li>
            <li className="mb-2 hover:bg-blue-700 p-2 rounded pl-6"><a href="/admin/permissions">Permissions</a></li>
            <li className="mb-6 hover:bg-blue-700 p-2 rounded pl-6"><a href="/admin/activity-logs">Activity log</a></li>
          </>
        )}
        <li className="mb-5 hover:bg-blue-700 p-2 rounded"><a href="/users">Users</a></li>
         <li className="mb-5 hover:bg-blue-700 p-2 rounded"><a href="/settings">Setting</a></li>
      </ul>
    </div>
  );
};

export default Sidebar;


