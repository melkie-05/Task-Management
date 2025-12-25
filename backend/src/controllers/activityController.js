import { db } from '../config/db.js';

export const listActivities = (req, res) => {
  // Use a.* to avoid selecting columns that may not exist on older DBs
  const sql = `SELECT a.*, u.id as user_id, u.name as user_name, u.email as user_email
               FROM activity_logs a
               LEFT JOIN users u ON u.id = a.user_id
               ORDER BY a.created_at DESC LIMIT 500`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('listActivities error:', err);
      return res.status(500).json({ message: 'Failed to fetch activities', error: err });
    }
    res.json(results);
  });
};

export const getActivity = (req, res) => {
  const { id } = req.params;
  db.query('SELECT a.*, u.id as user_id, u.name as user_name, u.email as user_email FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id WHERE a.id = ?', [id], (err, results) => {
    if (err) {
      console.error('getActivity error:', err);
      return res.status(500).json({ message: 'Failed to fetch activity', error: err });
    }
    if (!results.length) return res.status(404).json({ message: 'Activity not found' });
    const row = results[0];
    let meta = null;
    try { meta = row.meta ? JSON.parse(row.meta) : null; } catch (e) { meta = row.meta; }
    res.json({ id: row.id, action: row.action, meta, ip: row.ip, created_at: row.created_at, resource_type: row.resource_type, resource_id: row.resource_id, severity: row.severity, user: { id: row.user_id, name: row.user_name, email: row.user_email } });
  });
};

export const addActivity = (userId, action, meta = null, ip = null) => {
  db.query('INSERT INTO activity_logs (user_id, action, meta, ip) VALUES (?, ?, ?, ?)', [userId, action, meta ? JSON.stringify(meta) : null, ip || null], (err) => {
    if (err) console.error('Failed to log activity', err);
  });
};
