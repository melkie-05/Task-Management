import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const config = {
  host: 'localhost',
  user: 'root',
  password: 'mk@1221',
  database: 'task_management',
};

async function run() {
  const conn = await mysql.createConnection({ host: config.host, user: config.user, password: config.password });
  // Ensure database exists
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
  await conn.end();

  const pool = await mysql.createPool(config);

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INT NOT NULL,
      permission_id INT NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS user_roles (
      user_id INT NOT NULL,
      role_id INT NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action VARCHAR(255) NOT NULL,
      meta JSON,
      ip VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;`,
  ];

  // Ensure additional fields exist for richer activity details
  const alterQueries = [
    "ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100) NULL",
    "ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS resource_id INT NULL",
    "ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'info'"
  ];

  try {
    for (const q of queries) {
      await pool.query(q);
    }

    for (const q of alterQueries) {
      await pool.query(q);
    }

    // Seed permissions
    const permissions = [
      ['manage_users', 'Create, update, delete and list users'],
      ['view_users', 'View user list and profiles'],
      ['manage_roles', 'Create and update roles'],
      ['manage_permissions', 'Create and update permissions'],
      ['view_activity_log', 'View activity logs'],
      ['manage_tasks', 'Create and manage tasks']
    ];

    for (const [name, desc] of permissions) {
      await pool.query('INSERT IGNORE INTO permissions (name, description) VALUES (?, ?)', [name, desc]);
    }

    // Seed roles
    await pool.query("INSERT IGNORE INTO roles (name, description) VALUES ('admin', 'Administrator'), ('user', 'Regular user')");

    // Assign all permissions to admin role
    const [rows] = await pool.query("SELECT id FROM roles WHERE name = 'admin'");
    const adminRoleId = rows[0].id;
    const [permRows] = await pool.query('SELECT id FROM permissions');
    for (const p of permRows) {
      await pool.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [adminRoleId, p.id]);
    }

    // Create a default admin user if not exists
    const adminEmail = 'admin@example.com';
    const defaultPassword = 'Password123!';

    const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    let adminUserId;
    if (!userRows.length) {
      const hashed = await bcrypt.hash(defaultPassword, 10);
      const [result] = await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['Admin', adminEmail, hashed]);
      adminUserId = result.insertId;
      console.log(`Created admin user: ${adminEmail} with password: ${defaultPassword}`);
    } else {
      adminUserId = userRows[0].id;
      console.log('Admin user already exists');
    }

    // Assign role to admin user
    await pool.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [adminUserId, adminRoleId]);

    console.log('Migration complete');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
}

run();
