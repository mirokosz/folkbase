import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/members/Members";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Repertoire from "./pages/repertoire/Repertoire";
import Schedule from "./pages/schedule/Schedule";
import Costumes from "./pages/costumes/Costumes";
import Attendance from "./pages/attendance/Attendance";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Trasa publiczna - Logowanie */}
          <Route path="/login" element={<Login />} />
          
          {/* Trasy chronione (wymagają logowania) */}
          <Route element={
             <ProtectedRoute>
                <AppLayout />
             </ProtectedRoute>
          }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/repertoire" element={<Repertoire />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/costumes" element={<Costumes />} />
              <Route path="/attendance" element={<Attendance />} />
          </Route>

          {/* Przekierowanie wszystkich nieznanych tras do dashboardu */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}