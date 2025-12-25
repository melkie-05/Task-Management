import express from 'express';
import * as userCtrl from '../controllers/userController.js';
import * as roleCtrl from '../controllers/roleController.js';
import * as permCtrl from '../controllers/permissionController.js';
import * as actCtrl from '../controllers/activityController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Users (admin)
router.get('/users', authenticate, authorize('view_users'), userCtrl.listUsers);
router.get('/users/:id', authenticate, authorize('view_users'), userCtrl.getUser);
router.post('/users', authenticate, authorize('manage_users'), userCtrl.createUser);
// allow users to update their own profile, or admins with manage_users
router.put('/users/:id', authenticate, userCtrl.updateUser);
router.delete('/users/:id', authenticate, authorize('manage_users'), userCtrl.deleteUser);
router.post('/users/:id/roles', authenticate, authorize('manage_users'), userCtrl.assignRole);
router.delete('/users/:id/roles', authenticate, authorize('manage_users'), userCtrl.removeRole);

// Roles
router.get('/roles', authenticate, authorize('manage_roles'), roleCtrl.listRoles);
router.post('/roles', authenticate, authorize('manage_roles'), roleCtrl.createRole);
router.put('/roles/:id', authenticate, authorize('manage_roles'), roleCtrl.updateRole);
router.delete('/roles/:id', authenticate, authorize('manage_roles'), roleCtrl.deleteRole);
router.post('/roles/:id/permissions', authenticate, authorize('manage_roles'), roleCtrl.assignPermission);
router.delete('/roles/:id/permissions', authenticate, authorize('manage_roles'), roleCtrl.removePermission);

// Permissions
router.get('/permissions', authenticate, authorize('manage_permissions'), permCtrl.listPermissions);
router.post('/permissions', authenticate, authorize('manage_permissions'), permCtrl.createPermission);
router.delete('/permissions/:id', authenticate, authorize('manage_permissions'), permCtrl.deletePermission);

// Activity logs
router.get('/activity-logs', authenticate, authorize('view_activity_log'), actCtrl.listActivities);
router.get('/activity-logs/:id', authenticate, authorize('view_activity_log'), actCtrl.getActivity);

export default router;
