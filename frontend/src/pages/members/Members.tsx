import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { MemberProfile } from "../../types";
import { Search, Trash2, UserCog, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toDate } from "../../utils/dates";
import { isBefore } from "date-fns";

// Rozszerzamy typ o pole wyliczane lokalnie
interface MemberWithStats extends MemberProfile {
    attendanceRate: number; 
}

export default function Members() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
        // 1. Pobierz listę członków (nasłuchiwanie na zmiany)
        const qMembers = query(collection(db, "teams", "folkbase", "members"), orderBy("lastName"));
        
        // 2. Pobierz grafik, aby obliczyć frekwencję
        const qSchedule = query(collection(db, "teams", "folkbase", "schedule"));
        const scheduleSnap = await getDocs(qSchedule);
        
        // Filtrujemy tylko wydarzenia, które już się odbyły (data wcześniejsza niż teraz)
        const pastEvents = scheduleSnap.docs
            .map(doc => doc.data())
            .filter(event => isBefore(toDate(event.startDate), new Date()));
        
        const totalPastEvents = pastEvents.length;

        const unsubscribe = onSnapshot(qMembers, (snapshot) => {
            const membersData = snapshot.docs.map((doc) => {
                const data = doc.data() as MemberProfile;
                
                // --- OBLICZANIE FREKWENCJI ---
                let rate = 0;
                if (totalPastEvents > 0) {
                    // Ile razy ID użytkownika pojawiło się w tablicy 'attendees' w przeszłych wydarzeniach
                    const attendedCount = pastEvents.filter(event => 
                        event.attendees && event.attendees.includes(doc.id)
                    ).length;
                    
                    rate = Math.round((attendedCount / totalPastEvents) * 100);
                }

                return {
                    uid: doc.id,
                    ...data,
                    attendanceRate: rate
                };
            });

            setMembers(membersData);
            setLoading(false);
        });

        return () => unsubscribe();
    };

    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć tego członka?")) {
      await deleteDoc(doc(db, "teams", "folkbase", "members", id));
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funkcja pomocnicza do koloru paska
  const getProgressColor = (rate: number) => {
      if (rate >= 75) return "bg-green-500";
      if (rate >= 50) return "bg-yellow-500";
      return "bg-red-500";
  };

  if (loading) return <div className="p-8 text-gray-500">Ładowanie listy...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Członkowie Zespołu</h1>
        <p className="text-gray-500 dark:text-slate-400">Zarządzaj tancerzami, instruktorami i kadrą.</p>
      </div>

      {/* Wyszukiwarka */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Szukaj po nazwisku..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-4">Osoba</th>
                <th className="p-4">Rola</th>
                <th className="p-4">Kontakt</th>
                <th className="p-4">Frekwencja</th>
                {isAdmin && <th className="p-4 text-right">Akcje</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredMembers.map((member) => (
                <tr key={member.uid} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                  
                  {/* OSOBA */}
                  <td className="p-4">
                    <Link to={`/profile/${member.uid}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shrink-0 overflow-hidden border border-gray-200 dark:border-slate-600">
                         {member.photoUrl ? (
                             <img src={member.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                             <span>{member.firstName?.[0]}{member.lastName?.[0]}</span>
                         )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {member.firstName} {member.lastName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            <span className="text-xs text-gray-500">{member.status === 'active' ? 'Aktywny' : 'Nieaktywny'}</span>
                        </div>
                      </div>
                    </Link>
                  </td>

                  {/* ROLA */}
                  <td className="p-4">
                    <span className={`
                        px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                        ${member.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                        ${member.role === 'instructor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                        ${member.role === 'member' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}
                    `}>
                      {member.role}
                    </span>
                  </td>

                  {/* KONTAKT */}
                  <td className="p-4">
                    <div className="text-sm space-y-1 text-gray-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <Mail size={14} /> {member.email}
                        </div>
                        {member.phone && (
                            <div className="flex items-center gap-2">
                                <Phone size={14} /> {member.phone}
                            </div>
                        )}
                    </div>
                  </td>

                  {/* FREKWENCJA (NAPRAWIONA) */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${getProgressColor(member.attendanceRate)} transition-all duration-500`} 
                                style={{ width: `${member.attendanceRate}%` }} // <-- Tu jest teraz prawdziwa wartość
                            ></div> 
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-slate-300 w-8">
                            {member.attendanceRate}%
                        </span>
                    </div>
                  </td>

                  {/* AKCJE */}
                  {isAdmin && (
                    <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link 
                                to={`/profile/${member.uid}`}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"
                                title="Zobacz profil / Edytuj"
                            >
                                <UserCog size={18} />
                            </Link>
                            <button 
                                onClick={() => handleDelete(member.uid!)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                title="Usuń członka"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                  )}

                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredMembers.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-slate-500">
                  Nie znaleziono osób spełniających kryteria.
              </div>
          )}
        </div>
      </div>
    </div>
  );
}