import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, setDoc, doc, serverTimestamp, deleteDoc, updateDoc, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, firebaseConfig } from "../../services/firebase";
import { MemberProfile } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { Plus, Search, Phone, Mail, Trash2, Pencil, User } from "lucide-react";
import { toDate } from "../../utils/dates";
import { isBefore } from "date-fns";
import { useNavigate } from "react-router-dom";

interface MemberWithStats extends MemberProfile {
    attendanceRate: number; 
}

export default function Members() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null);

  const canManage = profile?.role === 'admin' || profile?.role === 'instructor';

  useEffect(() => {
    const fetchData = async () => {
        const membersUnsub = onSnapshot(query(collection(db, "teams", "folkbase", "members"), orderBy("lastName")), async (membersSnap) => {
            let membersData = membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MemberProfile[];

            membersData = membersData.filter(member => member.role !== 'admin' && member.role !== 'instructor');

            const scheduleSnap = await getDocs(collection(db, "teams", "folkbase", "schedule"));
            const pastEvents = scheduleSnap.docs
                .map(doc => doc.data() as any)
                .filter(event => isBefore(toDate(event.startDate), new Date()));

            const totalEvents = pastEvents.length;

            const membersWithStats = membersData.map(member => {
                if (totalEvents === 0) return { ...member, attendanceRate: 0 };
                
                const attendedCount = pastEvents.filter(event => 
                    event.attendees && event.attendees.includes(member.uid)
                ).length;

                return {
                    ...member,
                    attendanceRate: Math.round((attendedCount / totalEvents) * 100)
                };
            });

            setMembers(membersWithStats);
            setLoading(false);
        });

        return () => membersUnsub();
    };

    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
      if(!window.confirm("Czy na pewno usunąć członka? (Konto logowania pozostanie, ale zniknie z list)")) return;
      try {
          await deleteDoc(doc(db, "teams", "folkbase", "members", id));
      } catch (e) { 
          console.error(e);
          alert("Błąd usuwania"); 
      }
  };

  const handleEdit = (member: MemberProfile) => {
      setEditingMember(member);
      setShowModal(true);
  };

  const handleAdd = () => {
      setEditingMember(null);
      setShowModal(true);
  }

  const AttendanceBar = ({ rate }: { rate: number }) => {
      let color = "bg-green-500";
      if (rate < 75) color = "bg-yellow-500";
      if (rate < 50) color = "bg-red-500";

      return (
          <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${color}`} style={{ width: `${rate}%` }}></div>
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400">{rate}%</span>
          </div>
      );
  };

  const RoleBadge = ({ role }: { role: string }) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      instructor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      member: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[role] || "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300"}`}>
        {role.toUpperCase()}
      </span>
    );
  };

  const filteredMembers = members.filter(m => 
      (m.lastName + " " + m.firstName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-4 text-gray-500 dark:text-slate-400">Ładowanie danych...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Członkowie Zespołu</h1>
          <p className="text-gray-500 dark:text-slate-400">Zarządzaj tancerzami, instruktorami i kadrą.</p>
        </div>
        {canManage && (
            <button onClick={handleAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm">
            <Plus size={20} /> Dodaj Członka
            </button>
        )}
      </div>

      {/* PASEK WYSZUKIWANIA */}
      <div className="flex items-center bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 w-full sm:w-96 transition-colors">
        <Search size={20} className="text-gray-400 ml-2" />
        <input 
          type="text" 
          placeholder="Szukaj po nazwisku..." 
          className="w-full px-3 py-1 outline-none text-sm bg-transparent text-gray-800 dark:text-white placeholder-gray-400"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABELA */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 text-xs uppercase font-medium">
            <tr>
              <th className="p-4">Osoba</th>
              <th className="p-4">Rola</th>
              <th className="p-4 hidden md:table-cell">Kontakt</th>
              <th className="p-4">Frekwencja</th>
              <th className="p-4 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-sm">
            {filteredMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{member.firstName} {member.lastName}</p>
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}></span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">{member.status === 'active' ? 'Aktywny' : 'Nieaktywny'}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <RoleBadge role={member.role} />
                </td>
                <td className="p-4 hidden md:table-cell text-gray-500 dark:text-slate-400 space-y-1">
                  <div className="flex items-center gap-2"><Mail size={14} /> {member.email}</div>
                  {member.phone && <div className="flex items-center gap-2"><Phone size={14} /> {member.phone}</div>}
                </td>
                <td className="p-4">
                    <AttendanceBar rate={member.attendanceRate} />
                </td>
                <td className="p-4 text-right">
                  {canManage && (
                      <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/profile/${member.id}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition" 
                            title="Zobacz pełny profil"
                          >
                              <User size={16} />
                          </button>

                          <button onClick={() => handleEdit(member)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition" title="Szybka Edycja">
                              <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(member.id!)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition" title="Usuń">
                              <Trash2 size={16} />
                          </button>
                      </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {members.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">Brak członków w zespole.</div>
        )}
      </div>

      {showModal && (
        <MemberModal 
            onClose={() => setShowModal(false)} 
            initialData={editingMember}
        />
      )}
    </div>
  );
}

// --- MODAL (Z OBSŁUGĄ DARK MODE) ---
function MemberModal({ onClose, initialData }: { onClose: () => void, initialData: MemberProfile | null }) {
    const isEditing = !!initialData;
    
    const [formData, setFormData] = useState({ 
        firstName: '', lastName: '', email: '', phone: '',
        password: '',
        role: 'member' 
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                firstName: initialData.firstName,
                lastName: initialData.lastName,
                email: initialData.email,
                phone: initialData.phone || '',
                password: '', 
                role: initialData.role
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (isEditing && initialData?.uid) {
                await updateDoc(doc(db, "teams", "folkbase", "members", initialData.uid), {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    displayName: `${formData.firstName} ${formData.lastName}`,
                    phone: formData.phone,
                    role: formData.role
                });
                alert("Zaktualizowano dane członka.");
                onClose();

            } else {
                const secondaryApp = initializeApp(firebaseConfig, "Secondary");
                const secondaryAuth = getAuth(secondaryApp);

                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
                const newUser = userCredential.user;

                await setDoc(doc(db, "teams", "folkbase", "members", newUser.uid), {
                    uid: newUser.uid,
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    displayName: `${formData.firstName} ${formData.lastName}`,
                    phone: formData.phone,
                    role: formData.role,
                    status: 'active',
                    createdAt: serverTimestamp()
                });

                await signOut(secondaryAuth);
                alert(`Stworzono użytkownika! \nLogin: ${formData.email}`);
                onClose();
            }
        } catch (error: any) {
            console.error(error);
            alert("Błąd: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{isEditing ? "Edytuj dane" : "Dodaj nowego członka"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Imię" required 
                            className="border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded w-full outline-none focus:ring-2 focus:ring-indigo-500" 
                            value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} 
                        />
                        <input placeholder="Nazwisko" required 
                            className="border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded w-full outline-none focus:ring-2 focus:ring-indigo-500" 
                            value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} 
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Kontakt</label>
                        <input type="email" placeholder="Email" required disabled={isEditing} 
                            className={`border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded w-full mb-2 outline-none focus:ring-2 focus:ring-indigo-500 ${isEditing ? 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400' : ''}`} 
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
                        />
                        <input type="tel" placeholder="Telefon (opcjonalnie)" 
                            className="border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded w-full outline-none focus:ring-2 focus:ring-indigo-500" 
                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                        />
                    </div>

                    {!isEditing && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-100 dark:border-yellow-900/30">
                            <label className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1 block">Hasło startowe</label>
                            <input type="text" placeholder="Minimum 6 znaków" required minLength={6} 
                                className="border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded w-full text-sm outline-none" 
                                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Rola</label>
                        <select 
                            className="border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded w-full outline-none focus:ring-2 focus:ring-indigo-500" 
                            value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                        >
                            <option value="member">Członek (Tancerz)</option>
                            <option value="instructor">Instruktor</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition">Anuluj</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition">
                            {submitting ? "Zapisywanie..." : (isEditing ? "Zapisz zmiany" : "Utwórz konto")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}