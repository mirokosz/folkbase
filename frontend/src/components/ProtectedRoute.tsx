import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // 1. Jeśli trwa ładowanie danych z Firebase, wyświetl prosty tekst/spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-indigo-600 font-medium">Wczytywanie uprawnień...</div>
      </div>
    );
  }

  // 2. Jeśli nie ma użytkownika, wyrzuć do logowania
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Jeśli wszystko ok, pokaż treść (czyli Dashboard/Layout)
  return <>{children}</>;
}