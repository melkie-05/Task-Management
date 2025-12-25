import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import * as actCtrl from './activityController.js';

export const listUsers = (req, res) => {
  const sql = `SELECT u.id, u.name, u.email, GROUP_CONCAT(r.name) as roles
               FROM users u
               LEFT JOIN user_roles ur ON ur.user_id = u.id
               LEFT JOIN roles r ON r.id = ur.role_id
               GROUP BY u.id`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    const users = results.map((u) => ({ id: u.id, name: u.name, email: u.email, roles: u.roles ? u.roles.split(',') : [] }));
    res.json(users);
  });
};

export const getUser = (req, res) => {
  const { id } = req.params;
  db.query('SELECT id, name, email FROM users WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (!results.length) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
};

export const createUser = (req, res) => {
  const { name, email, password, roles = [] } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });

  db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length) return res.status(409).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashed], (err, result) => {
      if (err) return res.status(500).json(err);
      const userId = result.insertId;
      if (roles.length) {
        const values = roles.map((r) => [userId, r]);
        db.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES ?', [values], (err2) => {
          if (err2) return res.status(500).json(err2);
          actCtrl.addActivity(userId, 'user.created', { createdBy: req.user?.id || null });
          res.status(201).json({ id: userId, name, email });
        });
      } else {
        actCtrl.addActivity(userId, 'user.created', { createdBy: req.user?.id || null });
        res.status(201).json({ id: userId, name, email });
      }
    });
  });
};

export const updateUser = (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  // allow if updating own profile or has manage_users permission
  if (parseInt(req.user?.id) !== parseInt(id) && !(req.user?.permissions || []).includes('manage_users')) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  db.query('SELECT id FROM users WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (!results.length) return res.status(404).json({ message: 'User not found' });

    const update = (hashed) => {
      const params = [name || null, email || null];
      let sql = 'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email)';
      if (hashed) {
        sql += ', password = ?';
        params.push(hashed);
      }
      sql += ' WHERE id = ?';
      params.push(id);

      db.query(sql, params, (err2) => {
        if (err2) return res.status(500).json(err2);
        // log activity for profile update (who updated, which user)
        actCtrl.addActivity(req.user?.id || null, 'user.updated', { userId: id });
        res.json({ message: 'User updated' });
      });
    };

    if (password) {
      bcrypt.hash(password, 10, (err2, hash) => {
        if (err2) return res.status(500).json(err2);
        update(hash);
      });
    } else {
      update();
    }
  });
};

export const deleteUser = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    actCtrl.addActivity(req.user?.id || null, 'user.deleted', { targetUserId: id });
    res.json({ message: 'User deleted' });
  });
};

export const assignRole = (req, res) => {
  const { id } = req.params; // user id
  const { roleId } = req.body;
  if (!roleId) return res.status(400).json({ message: 'roleId is required' });
  db.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [id, roleId], (err) => {
    if (err) return res.status(500).json(err);
    actCtrl.addActivity(req.user?.id || null, 'user.role.assigned', { userId: id, roleId });
    res.json({ message: 'Role assigned' });
  });
};

export const removeRole = (req, res) => {
  const { id } = req.params; // user id
  const { roleId } = req.body;
  if (!roleId) return res.status(400).json({ message: 'roleId is required' });
  db.query('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?', [id, roleId], (err) => {
    if (err) return res.status(500).json(err);
    actCtrl.addActivity(req.user?.id || null, 'user.role.removed', { userId: id, roleId });
    res.json({ message: 'Role removed' });
  });
};
