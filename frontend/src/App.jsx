import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Settings from "./pages/Setting";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminUsers from "./pages/AdminUsers";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import ActivityLog from "./pages/ActivityLog";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/roles" element={<ProtectedRoute><Roles /></ProtectedRoute>} />
        <Route path="/admin/permissions" element={<ProtectedRoute><Permissions /></ProtectedRoute>} />
        <Route path="/admin/activity-logs" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
