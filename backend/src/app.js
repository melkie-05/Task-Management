
import express from "express";
import cors from "cors";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import taskRoutes from "./routes/taskRoutes.js";
import userManagementRoutes from "./routes/userManagementRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// existing API
app.use("/api", taskRoutes);

// admin / user-management APIs
app.use('/api/admin', userManagementRoutes);

// Swagger / OpenAPI docs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const specPath = path.join(__dirname, '../docs/openapi.yaml');
let swaggerSpec = {};
try {
  const file = fs.readFileSync(specPath, 'utf8');
  swaggerSpec = yaml.load(file);
} catch (e) {
  console.error('Failed to load OpenAPI spec:', e);
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

export default app;
