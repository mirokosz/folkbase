import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// ZMIANA: Przywracamy bezpośredni import z Firebase
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Dodano stan ładowania
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ZMIANA: Używamy funkcji z SDK Firebase, a nie z contextu
      await signInWithEmailAndPassword(auth, email, password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Błąd logowania:", error);
      alert("Nie udało się zalogować. Sprawdź dane.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900 transition-colors font-sans">
      <div className="px-8 py-8 text-left bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md transition-colors">
        <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Zaloguj się do FolkBase</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2" htmlFor="email">Email</label>
              <input
                type="email"
                placeholder="wpisz@email.com"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent
                           bg-gray-50 dark:bg-slate-900
                           text-gray-900 dark:text-white
                           border-gray-200 dark:border-slate-600
                           placeholder-gray-400 dark:placeholder-slate-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2" htmlFor="password">Hasło</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent
                           bg-gray-50 dark:bg-slate-900
                           text-gray-900 dark:text-white
                           border-gray-200 dark:border-slate-600
                           placeholder-gray-400 dark:placeholder-slate-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 mt-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-70"
              >
                  {loading ? "Logowanie..." : "Zaloguj się"}
              </button>
            </div>
          </div>
        </form>
          <p className="mt-6 text-xs text-center text-gray-500 dark:text-slate-400">
              Nie masz konta? Skontaktuj się z administratorem zespołu.
          </p>
      </div>
    </div>
  );
}