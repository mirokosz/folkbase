import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react"; // Import ikony menu

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Przekazujemy stan do Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Główna zawartość */}
      <main className="flex-1 md:ml-64 transition-all duration-300">
        
        {/* Przycisk otwierania menu (widoczny tylko na mobile) */}
        <div className="md:hidden p-4 pb-0 flex items-center">
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
                <Menu size={24} />
            </button>
            <span className="ml-4 font-bold text-gray-800 dark:text-white text-lg">FolkBase</span>
        </div>

        {/* Kontener na treść podstron */}
        <div className="p-4 md:p-8">
            <Outlet />
        </div>
      </main>
    </div>
  );
}