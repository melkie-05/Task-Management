import mysql from "mysql2";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "mk@1221",
  database: "task_management",
});
