import { NavLink, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Shirt, 
  CalendarDays, 
  Music2, 
  LogOut,
  ClipboardCheck,
  Sun,
  Moon,
  BarChart2,
  Mic2,
  X // <--- Dodano ikonę X do zamykania
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { logout, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { path: "/dashboard", label: "Pulpit", icon: LayoutDashboard },
    { path: "/members", label: "Członkowie", icon: Users },
    { path: "/schedule", label: "Grafik", icon: CalendarDays },
    { path: "/attendance", label: "Obecność", icon: ClipboardCheck },
    { path: "/polls", label: "Ankiety", icon: BarChart2 },
    { path: "/concerts", label: "Planer Koncertów", icon: Mic2 },
    { path: "/repertoire", label: "Repertuar", icon: Music2 },
    { path: "/costumes", label: "Stroje", icon: Shirt },
  ];

  return (
    <>
        {/* TŁO PRZYCIEMNIAJĄCE (Overlay) - Tylko na mobile */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setIsOpen(false)}
            />
        )}

        {/* SIDEBAR */}
        <div className={`
            fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 z-50 transition-transform duration-300
            ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}>
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-indigo-400">FolkBase</h1>
                <p className="text-xs text-slate-400 mt-1">Zarządzanie Zespołem</p>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                    title="Zmień motyw"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                {/* Przycisk X do zamykania na mobile */}
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white md:hidden"
                >
                    <X size={18} />
                </button>
            </div>
          </div>

          <Link 
            to="/profile" 
            onClick={() => setIsOpen(false)} // Zamknij po kliknięciu w profil
            className="p-4 border-b border-slate-800 bg-slate-800/50 hover:bg-slate-800 transition cursor-pointer block text-left group"
          >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shadow-md group-hover:scale-105 transition-transform">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </div>
                <div>
                    <p className="text-sm font-medium group-hover:text-indigo-300 transition-colors">
                        {profile?.firstName} {profile?.lastName}
                    </p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{profile?.role}</p>
                </div>
            </div>
          </Link>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)} // Zamknij menu po kliknięciu w link (mobile)
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button 
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Wyloguj się</span>
            </button>
          </div>
        </div>
    </>
  );
}