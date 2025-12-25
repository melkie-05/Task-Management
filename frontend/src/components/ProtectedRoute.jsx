import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // accept token from either localStorage (remember me) or sessionStorage (temporary)
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
} 
