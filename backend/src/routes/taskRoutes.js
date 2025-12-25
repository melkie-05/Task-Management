import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticate } from "../middleware/auth.js";
import { db } from "../config/db.js";

const router = express.Router();

// Tasks
router.get("/tasks", (req, res) => {
  db.query("SELECT * FROM tasks", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get a single task by id (optional)
router.get("/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM tasks WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results[0]);
  });
});

// ----- USER ROUTES -----
// Return users without password (protected)
router.get("/users", authenticate, (req, res) => {
  db.query("SELECT id, name, email FROM users", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get a single user by id (optional, protected)
router.get("/users/:id", authenticate, (req, res) => {
  const { id } = req.params;
  db.query("SELECT id, name, email FROM users WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results[0]);
  });
});

// Create a new user (register)
router.post("/users", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

  db.query("SELECT id FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length) return res.status(409).json({ message: "Email already in use" });

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json(err);

      db.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hash],
        (err, result) => {
          if (err) return res.status(500).json(err);
          res.status(201).json({ id: result.insertId, name, email });
        }
      );
    });
  });
});

// Login
router.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json(err);
    if (!results.length) return res.status(401).json({ message: "Invalid credentials" });

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json(err);
      if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "secretkey", {
        expiresIn: "8h",
      });

      // log login
      import('../controllers/activityController.js').then((m) => m.addActivity(user.id, 'auth.login', { ip: req.ip }));

      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
  });
});

// Get my profile
router.get("/auth/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Update user (self)
router.put("/users/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (req.user.id !== Number(id)) return res.status(403).json({ message: "Forbidden: can only update your own profile" });

  db.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length) return res.status(409).json({ message: "Email already in use" });

    const updateUser = (hashedPassword) => {
      const params = [name || req.user.name, email || req.user.email];
      let sql = "UPDATE users SET name = ?, email = ?";
      if (hashedPassword) {
        sql += ", password = ?";
        params.push(hashedPassword);
      }
      sql += " WHERE id = ?";
      params.push(id);

      db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: Number(id), name: name || req.user.name, email: email || req.user.email });
      });
    };

    if (password) {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json(err);
        updateUser(hash);
      });
    } else {
      updateUser();
    }
  });
});

// Delete user (admin or self)
router.delete("/users/:id", authenticate, (req, res) => {
  const { id } = req.params;
  // Only allow if current user is deleting self or an admin flag is in DB (simple check: allow self)
  if (req.user.id !== Number(id)) {
    // For now prevent deleting others—return forbidden
    return res.status(403).json({ message: "Forbidden: cannot delete other users" });
  }

  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  });
});

// Tasks management (protected)
router.post('/tasks', authenticate, (req, res) => {
  const { title, description, status = 'todo' } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  db.query('INSERT INTO tasks (title, description, status, created_by) VALUES (?, ?, ?, ?)', [title, description, status, req.user.id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.status(201).json({ id: result.insertId, title, description, status });
  });
});

router.put('/tasks/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  db.query('UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?', [title, description, status, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Task updated' });
  });
});

router.delete('/tasks/:id', authenticate, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tasks WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Task deleted' });
  });
});

export default router;
