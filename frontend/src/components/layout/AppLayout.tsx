import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    // ZMIANA TUTAJ: Dodano 'dark:bg-slate-900' oraz 'transition-colors'
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Sidebar na sztywno po lewej */}
      <Sidebar />

      {/* Główna zawartość */}
      <main className="flex-1 ml-64 p-8">
        <Outlet /> 
      </main>
    </div>
  );
}