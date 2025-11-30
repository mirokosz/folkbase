import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar na sztywno po lewej */}
      <Sidebar />

      {/* Główna zawartość przesunięta o szerokość Sidebaru */}
      <main className="flex-1 ml-64 p-8">
        <Outlet /> 
        {/* Tutaj React Router "wstrzyknie" komponent Dashboard, Members itd. */}
      </main>
    </div>
  );
}