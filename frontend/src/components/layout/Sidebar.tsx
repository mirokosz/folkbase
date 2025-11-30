import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Shirt, 
  CalendarDays, 
  Music2, 
  LogOut, 
  ClipboardCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { logout, profile } = useAuth();

  const menuItems = [
    { path: "/dashboard", label: "Pulpit", icon: LayoutDashboard },
    { path: "/members", label: "Członkowie", icon: Users },
    { path: "/schedule", label: "Grafik", icon: CalendarDays },
    { path: "/attendance", label: "Obecność", icon: ClipboardCheck },
    { path: "/repertoire", label: "Repertuar", icon: Music2 },
    { path: "/costumes", label: "Stroje", icon: Shirt },
  ];

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0">
      {/* Logo / Nagłówek */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-indigo-400">FolkBase</h1>
        <p className="text-xs text-slate-400 mt-1">Zarządzanie Zespołem</p>
      </div>

      {/* Profil zalogowanego */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/50">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                {profile?.firstName?.[0]}{profile?.lastName?.[0]}
            </div>
            <div>
                <p className="text-sm font-medium">{profile?.firstName} {profile?.lastName}</p>
                <p className="text-xs text-slate-400 uppercase">{profile?.role}</p>
            </div>
        </div>
      </div>

      {/* Nawigacja */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Przycisk Wylogowania */}
      <div className="p-4 border-t border-slate-700">
        <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Wyloguj się</span>
        </button>
      </div>
    </div>
  );
}