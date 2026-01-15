import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/members/Members";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Repertoire from "./pages/repertoire/Repertoire";
import Schedule from "./pages/schedule/Schedule";
import Gallery from "./pages/gallery/Gallery";
import Costumes from "./pages/costumes/Costumes";
import Attendance from "./pages/attendance/Attendance";
import QRScanner from "./pages/scanner/Scanner";
import Profile from "./pages/profile/Profile";
import Polls from "./pages/polls/Polls";
import ConcertPlanner from "./pages/concerts/ConcertPlanner";
import { ThemeProvider } from "./context/ThemeContext";



export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
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
              <Route path="/scan" element={<QRScanner />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/polls" element={<Polls />} />
              <Route path="/concerts" element={<ConcertPlanner />} />
              <Route path="/gallery" element={<Gallery />} />
          </Route>

          {/* Przekierowanie wszystkich nieznanych tras do dashboardu */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}