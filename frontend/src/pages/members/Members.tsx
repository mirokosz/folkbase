import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { MemberProfile } from "../../types";
import { Search, Trash2, UserCog, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Members() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const q = query(collection(db, "teams", "folkbase", "members"), orderBy("lastName"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as MemberProfile[];
      setMembers(membersData);
      setLoading(false);
    });
    return () => unsubscribe();
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

  if (loading) return <div className="p-8 text-gray-500">Ładowanie listy...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Członkowie Zespołu</h1>
        <p className="text-gray-500 dark:text-slate-400">Wszyscy w jednym miejscu.</p>
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

      {/* --- WIDOK DESKTOPOWY (TABELA) --- */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
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

                  {/* FREKWENCJA */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-3/4"></div> 
                        </div>
                        <span className="text-xs font-bold text-gray-500">75%</span>
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
        </div>
      </div>

      {/* --- WIDOK MOBILNY (KARTY) --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredMembers.map(member => (
              <div key={member.uid} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col gap-3 relative">
                  {/* Nagłówek Karty */}
                  <Link to={`/profile/${member.uid}`} className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shrink-0 overflow-hidden border border-gray-200 dark:border-slate-600">
                           {member.photoUrl ? (
                               <img src={member.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                           ) : (
                               <span>{member.firstName?.[0]}{member.lastName?.[0]}</span>
                           )}
                       </div>
                       <div>
                            <h3 className="font-bold text-gray-800 dark:text-white text-lg leading-tight">
                                {member.firstName} {member.lastName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                <span className="text-xs text-gray-500">{member.status === 'active' ? 'Aktywny' : 'Nieaktywny'}</span>
                            </div>
                       </div>
                  </Link>
                  
                  {/* Badge Roli */}
                  <div>
                    <span className={`
                        px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                        ${member.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                        ${member.role === 'instructor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                        ${member.role === 'member' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}
                    `}>
                      {member.role}
                    </span>
                  </div>

                  {/* Kontakt */}
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg text-sm space-y-1.5 text-gray-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" /> 
                          <span className="truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                          <div className="flex items-center gap-2">
                              <Phone size={16} className="text-gray-400" /> {member.phone}
                          </div>
                      )}
                  </div>
                  
                  {/* Akcje Admina (Absolutnie w rogu) */}
                  {isAdmin && (
                      <div className="absolute top-4 right-4 flex gap-2">
                           <Link to={`/profile/${member.uid}`} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:text-indigo-600 transition">
                               <UserCog size={18} />
                           </Link>
                           <button onClick={() => handleDelete(member.uid!)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500 hover:bg-red-100 transition">
                               <Trash2 size={18} />
                           </button>
                      </div>
                  )}
              </div>
          ))}
          
          {filteredMembers.length === 0 && (
              <div className="text-center py-10 text-gray-500 dark:text-slate-500">
                  Brak wyników.
              </div>
          )}
      </div>
    </div>
  );
}