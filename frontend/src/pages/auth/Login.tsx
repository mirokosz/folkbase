import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebase";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock } from "lucide-react"; // Nowe ikony

export default function Login() {
  // Stan formularza
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Stan UI
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Do ikony "Oka"
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // Do wyświetlania błędów
  const [successMsg, setSuccessMsg] = useState<string | null>(null); // Do komunikatu o resetowaniu
  const [view, setView] = useState<'login' | 'reset'>('login'); // Przełącznik widoków

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  // Tłumacz błędów Firebase na polski
  const getFriendlyErrorMessage = (errorCode: string) => {
      switch (errorCode) {
          case 'auth/invalid-credential':
              return "Błędny email lub hasło.";
          case 'auth/user-not-found':
              return "Nie znaleziono konta o tym adresie.";
          case 'auth/wrong-password':
              return "Błędne hasło.";
          case 'auth/too-many-requests':
              return "Za dużo nieudanych prób. Spróbuj później.";
          case 'auth/invalid-email':
              return "Niepoprawny format adresu email.";
          default:
              return "Wystąpił błąd logowania. Spróbuj ponownie.";
      }
  };

  // Obsługa Logowania
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error("Błąd logowania:", error);
      setErrorMsg(getFriendlyErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  // Obsługa Resetowania Hasła
  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) {
          setErrorMsg("Wpisz adres email.");
          return;
      }
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      try {
          await sendPasswordResetEmail(auth, email);
          setSuccessMsg("Link do resetowania hasła został wysłany na Twój email!");
          // Opcjonalnie: wyczyść email po sukcesie
          // setEmail(""); 
      } catch (error: any) {
          console.error("Błąd resetowania:", error);
          setErrorMsg(getFriendlyErrorMessage(error.code));
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900 transition-colors font-sans p-4">
      <div className="px-8 py-10 text-left bg-white dark:bg-slate-800 shadow-2xl rounded-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md transition-colors relative overflow-hidden">
        
        {/* Dekoracyjny gradient na górze */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

        <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-2">FolkBase</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm">Zarządzanie Zespołem Ludowym</p>
        </div>

        {/* --- KOMUNIKATY BŁĘDÓW / SUKCESÓW --- */}
        {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-lg text-center font-medium animate-in fade-in slide-in-from-top-2">
                {errorMsg}
            </div>
        )}
        {successMsg && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-300 text-sm rounded-lg text-center font-medium animate-in fade-in slide-in-from-top-2">
                {successMsg}
            </div>
        )}

        {/* --- WIDOK LOGOWANIA --- */}
        {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center">Zaloguj się</h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="email"
                        placeholder="wpisz@email.com"
                        className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent
                                bg-gray-50 dark:bg-slate-900
                                text-gray-900 dark:text-white
                                border-gray-200 dark:border-slate-600
                                placeholder-gray-400 dark:placeholder-slate-500 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Hasło</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent
                                bg-gray-50 dark:bg-slate-900
                                text-gray-900 dark:text-white
                                border-gray-200 dark:border-slate-600
                                placeholder-gray-400 dark:placeholder-slate-500 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-indigo-600 transition"
                        tabIndex={-1} // Żeby nie przeskakiwać tabulatorem na oko
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                <div className="text-right mt-1">
                    <button 
                        type="button" 
                        onClick={() => { setView('reset'); setErrorMsg(null); setSuccessMsg(null); }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                        Nie pamiętasz hasła?
                    </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Zaloguj się"}
              </button>
            </form>
        ) : (
            /* --- WIDOK RESETOWANIA HASŁA --- */
            <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center mb-4">
                    <button 
                        type="button" 
                        onClick={() => { setView('login'); setErrorMsg(null); setSuccessMsg(null); }}
                        className="p-1 -ml-2 text-gray-400 hover:text-indigo-600 transition rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white ml-2">Reset hasła</h3>
                </div>

                <p className="text-sm text-gray-500 dark:text-slate-400">
                    Podaj adres email powiązany z Twoim kontem. Wyślemy Ci link do ustawienia nowego hasła.
                </p>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="email"
                            placeholder="wpisz@email.com"
                            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent
                                    bg-gray-50 dark:bg-slate-900
                                    text-gray-900 dark:text-white
                                    border-gray-200 dark:border-slate-600
                                    placeholder-gray-400 dark:placeholder-slate-500 transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Wyślij link resetujący"}
                </button>
            </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 text-center">
             <p className="text-xs text-gray-400 dark:text-slate-500">
                 Nie masz konta? Skontaktuj się z administratorem zespołu.
             </p>
        </div>
      </div>
    </div>
  );
}