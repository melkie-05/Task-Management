import { db } from '../config/db.js';

export const listRoles = (req, res) => {
  const sql = `SELECT r.id, r.name, r.description, GROUP_CONCAT(p.name) as permissions
               FROM roles r
               LEFT JOIN role_permissions rp ON rp.role_id = r.id
               LEFT JOIN permissions p ON p.id = rp.permission_id
               GROUP BY r.id`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    const roles = results.map((r) => ({ id: r.id, name: r.name, description: r.description, permissions: r.permissions ? r.permissions.split(',') : [] }));
    res.json(roles);
  });
};

export const createRole = (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  db.query('INSERT INTO roles (name, description) VALUES (?, ?)', [name, description || null], (err, result) => {
    if (err) return res.status(500).json(err);
    res.status(201).json({ id: result.insertId, name, description });
  });
};

export const updateRole = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  db.query('UPDATE roles SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?', [name, description, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Role updated' });
  });
};

export const deleteRole = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM roles WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted' });
  });
};

export const assignPermission = (req, res) => {
  const { id } = req.params; // role id
  const { permissionId } = req.body;
  if (!permissionId) return res.status(400).json({ message: 'permissionId is required' });
  db.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [id, permissionId], (err) => {
    if (err) return res.status(500).json(err);
    // log
    import('./activityController.js').then((m) => m.addActivity(req.user?.id || null, 'role.permission.assigned', { roleId: id, permissionId }));
    res.json({ message: 'Permission assigned' });
  });
};

export const removePermission = (req, res) => {
  const { id } = req.params; // role id
  const { permissionId } = req.body;
  if (!permissionId) return res.status(400).json({ message: 'permissionId is required' });
  db.query('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?', [id, permissionId], (err) => {
    if (err) return res.status(500).json(err);
    import('./activityController.js').then((m) => m.addActivity(req.user?.id || null, 'role.permission.removed', { roleId: id, permissionId }));
    res.json({ message: 'Permission removed' });
  });
};
