import { db } from '../config/db.js';

export const listPermissions = (req, res) => {
  db.query('SELECT id, name, description FROM permissions', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

export const createPermission = (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  db.query('INSERT INTO permissions (name, description) VALUES (?, ?)', [name, description || null], (err, result) => {
    if (err) return res.status(500).json(err);
    res.status(201).json({ id: result.insertId, name, description });
  });
};

export const deletePermission = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM permissions WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Permission not found' });
    res.json({ message: 'Permission deleted' });
  });
};
