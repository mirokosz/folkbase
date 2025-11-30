import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { MemberProfile } from "../../types";
import { Plus, Search, Phone, Mail } from "lucide-react";

export default function Members() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // Stan dla modala

  // --- LOGIKA POBIERANIA DANYCH (REALTIME) ---
  useEffect(() => {
    const q = query(collection(db, "teams", "folkbase", "members"), orderBy("lastName"));
    
    // onSnapshot nasłuchuje zmian w bazie na żywo
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MemberProfile[];
      
      setMembers(membersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  // --- KOMPONENTY UI (HELPERY) ---
  const RoleBadge = ({ role }: { role: string }) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800",
      instructor: "bg-blue-100 text-blue-800",
      member: "bg-green-100 text-green-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[role] || "bg-gray-100 text-gray-800"}`}>
        {role.toUpperCase()}
      </span>
    );
  };

  if (loading) return <div className="p-4">Ładowanie listy członków...</div>;

  return (
    <div className="space-y-6">
      {/* NAGŁÓWEK + AKCJE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Członkowie Zespołu</h1>
          <p className="text-gray-500">Zarządzaj tancerzami, instruktorami i kadrą.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={20} />
          Dodaj Członka
        </button>
      </div>

      {/* PASEK FILTRÓW (ATRAPA - na razie tylko wygląd) */}
      <div className="flex items-center bg-white p-2 rounded-lg shadow-sm border border-gray-200 w-full sm:w-96">
        <Search size={20} className="text-gray-400 ml-2" />
        <input 
          type="text" 
          placeholder="Szukaj po nazwisku..." 
          className="w-full px-3 py-1 outline-none text-sm"
        />
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="p-4">Osoba</th>
              <th className="p-4">Rola</th>
              <th className="p-4">Kontakt</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.firstName} {member.lastName}</p>
                      {/* Tutaj możemy wyświetlić np. wzrost w przyszłości */}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <RoleBadge role={member.role} />
                </td>
                <td className="p-4 text-gray-500 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail size={14} /> {member.email}
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} /> {member.phone}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <span className={`inline-flex w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-yellow-400'} mr-2`}></span>
                  {member.status === 'active' ? 'Aktywny' : 'Oczekujący'}
                </td>
                <td className="p-4 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Edytuj</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {members.length === 0 && (
            <div className="p-8 text-center text-gray-500">Brak członków w zespole. Dodaj pierwszego!</div>
        )}
      </div>

      {/* MODAL DODAWANIA (Prosty formularz) */}
      {showModal && (
        <AddMemberModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

// --- SUBKOMPONENT: MODAL DODAWANIA ---
function AddMemberModal({ onClose }: { onClose: () => void }) {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', role: 'member' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addDoc(collection(db, "teams", "folkbase", "members"), {
                ...formData,
                status: 'active', // Admin dodaje, więc od razu aktywny
                createdAt: serverTimestamp()
            });
            onClose();
        } catch (error) {
            alert("Błąd dodawania członka");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-lg font-bold mb-4">Dodaj nową osobę</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                           placeholder="Imię" required 
                           className="border p-2 rounded w-full"
                           value={formData.firstName}
                           onChange={e => setFormData({...formData, firstName: e.target.value})}
                        />
                         <input 
                           placeholder="Nazwisko" required 
                           className="border p-2 rounded w-full"
                           value={formData.lastName}
                           onChange={e => setFormData({...formData, lastName: e.target.value})}
                        />
                    </div>
                    <input 
                        type="email" placeholder="Email" required 
                        className="border p-2 rounded w-full"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                    <select 
                        className="border p-2 rounded w-full"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                        <option value="member">Członek (Tancerz)</option>
                        <option value="instructor">Instruktor</option>
                        <option value="admin">Administrator</option>
                    </select>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Anuluj</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                            {submitting ? "Dodawanie..." : "Dodaj osobę"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}