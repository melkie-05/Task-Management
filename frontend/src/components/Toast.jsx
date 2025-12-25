import React from "react";

export default function Toast({ children, type = "info" }) {
  const color = type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700";
  return (
    <div className={`p-3 rounded shadow-sm ${color} text-sm`}>{children}</div>
  );
}
