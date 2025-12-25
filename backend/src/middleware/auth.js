import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "Missing or invalid authorization header" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, payload) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });
    // attach user id and email from token
    req.user = payload; // { id, email }

    // Optionally, fetch user data from DB and attach
    db.query("SELECT id, name, email FROM users WHERE id = ?", [payload.id], (err, results) => {
      if (err) return res.status(500).json(err);
      if (!results.length) return res.status(401).json({ message: "User not found" });
      const user = results[0];

      // fetch roles for user
      db.query(
        "SELECT r.id, r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?",
        [user.id],
        (err, roleRows) => {
          if (err) return res.status(500).json(err);
          const roles = roleRows.map((r) => r.name);

          // fetch permissions via roles
          db.query(
            "SELECT DISTINCT p.name FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id JOIN user_roles ur ON ur.role_id = rp.role_id WHERE ur.user_id = ?",
            [user.id],
            (err, permRows) => {
              if (err) return res.status(500).json(err);
              const permissions = permRows.map((p) => p.name);

              req.user = { ...user, roles, permissions };
              next();
            }
          );
        }
      );
    });
  });
};
