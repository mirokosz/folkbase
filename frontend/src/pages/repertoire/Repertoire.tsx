import React, { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { RepertoireItem } from "../../types";
import { getYouTubeThumbnail } from "../../utils/youtube";
import { useAuth } from "../../context/AuthContext"; // <--- Do sprawdzania uprawnień
import { Plus, Music2, Video, FileText, ExternalLink, PlayCircle, Pencil, Trash2 } from "lucide-react";

export default function Repertoire() {
  const { profile } = useAuth(); // Pobieramy profil zalogowanego
  const [items, setItems] = useState<RepertoireItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stan modala teraz przechowuje też obiekt do edycji (lub null)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RepertoireItem | null>(null);

  // Sprawdzamy czy użytkownik może zarządzać (Admin lub Instruktor)
  const canManage = profile?.role === 'admin' || profile?.role === 'instructor';

  useEffect(() => {
    const q = query(collection(db, "teams", "folkbase", "repertoire"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RepertoireItem)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
      if (!window.confirm("Czy na pewno chcesz usunąć ten utwór?")) return;
      try {
          await deleteDoc(doc(db, "teams", "folkbase", "repertoire", id));
      } catch (error) {
          console.error("Błąd usuwania", error);
          alert("Nie udało się usunąć elementu.");
      }
  };

  const openEditModal = (item: RepertoireItem) => {
      setEditingItem(item);
      setIsModalOpen(true);
  };

  const openAddModal = () => {
      setEditingItem(null); // Czyścimy przed dodawaniem nowego
      setIsModalOpen(true);
  };

  // Helpery UI
  const DifficultyBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800"
    };
    const labels: Record<string, string> = { easy: "Łatwy", medium: "Średni", hard: "Trudny" };
    return <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[level] || "bg-gray-100"}`}>{labels[level] || level}</span>;
  };

  const TypeIcon = ({ type }: { type: string }) => {
     if (type === 'song') return <Music2 size={16} className="text-pink-500" />;
     if (type === 'dance') return <Video size={16} className="text-indigo-500" />;
     return <Music2 size={16} className="text-blue-500" />;
  };

  if (loading) return <div className="p-8">Ładowanie repertuaru...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Repertuar</h1>
           <p className="text-gray-500">Choreografie, pieśni i nuty zespołu.</p>
        </div>
        {canManage && (
            <button onClick={openAddModal} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm">
            <Plus size={20} /> Dodaj Utwór
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
            const thumbnail = item.youtubeLink ? getYouTubeThumbnail(item.youtubeLink) : null;
            
            return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group relative">
                    
                    {/* Przyciski Akcji (Tylko dla Admina/Instruktora) */}
                    {canManage && (
                        <div className="absolute top-2 left-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                            <button 
                                onClick={() => openEditModal(item)}
                                className="bg-white/90 p-2 rounded-full text-gray-700 hover:text-indigo-600 shadow-sm hover:bg-white" title="Edytuj">
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={() => item.id && handleDelete(item.id)}
                                className="bg-white/90 p-2 rounded-full text-gray-700 hover:text-red-600 shadow-sm hover:bg-white" title="Usuń">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}

                    {/* Sekcja wideo/miniaturki */}
                    <div className="h-40 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                        {thumbnail ? (
                            <>
                                <img src={thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <PlayCircle size={48} className="text-white drop-shadow-lg" />
                                </div>
                                <a href={item.youtubeLink} target="_blank" rel="noreferrer" className="absolute inset-0 z-10" aria-label="Otwórz wideo"></a>
                            </>
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center">
                                <Music2 size={48} className="mb-2 opacity-20" />
                                <span className="text-xs uppercase tracking-widest opacity-50">Brak wideo</span>
                            </div>
                        )}
                        <div className="absolute top-2 right-2 z-10">
                             <DifficultyBadge level={item.difficulty} />
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TypeIcon type={item.type} />
                            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wide">{item.type === 'dance' ? 'Taniec' : item.type === 'song' ? 'Pieśń' : 'Muzyka'}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">{item.description || "Brak dodatkowego opisu."}</p>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                            {item.driveLink && (
                                <a href={item.driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:underline relative z-20">
                                    <FileText size={16} /> Nuty/Opis
                                </a>
                            )}
                            {item.youtubeLink && (
                                <a href={item.youtubeLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-red-600 hover:underline ml-auto relative z-20">
                                    <ExternalLink size={16} /> YouTube
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )
        })}
      </div>

      {isModalOpen && (
        <RepertoireModal 
            initialData={editingItem} 
            onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}

// --- MODAL (Teraz obsługuje też edycję) ---
function RepertoireModal({ onClose, initialData }: { onClose: () => void, initialData: RepertoireItem | null }) {
    const [formData, setFormData] = useState({ 
        title: '', type: 'dance', difficulty: 'medium', youtubeLink: '', driveLink: '', description: '' 
    });
    const [loading, setLoading] = useState(false);

    // Wypełnij formularz jeśli edytujemy
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                type: initialData.type,
                difficulty: initialData.difficulty,
                youtubeLink: initialData.youtubeLink || '',
                driveLink: initialData.driveLink || '',
                description: initialData.description || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData && initialData.id) {
                // TRYB EDYCJI: updateDoc
                const docRef = doc(db, "teams", "folkbase", "repertoire", initialData.id);
                await updateDoc(docRef, { ...formData });
            } else {
                // TRYB DODAWANIA: addDoc
                await addDoc(collection(db, "teams", "folkbase", "repertoire"), {
                    ...formData,
                    createdAt: serverTimestamp()
                });
            }
            onClose();
        } catch (err) {
            console.error(err);
            alert("Wystąpił błąd podczas zapisywania.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                    {initialData ? "Edytuj utwór" : "Dodaj do repertuaru"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tytuł</label>
                        <input className="w-full border p-2 rounded" required 
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Typ</label>
                            <select className="w-full border p-2 rounded"
                                value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                <option value="dance">Taniec</option>
                                <option value="song">Pieśń</option>
                                <option value="music">Utwór Kapeli</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Poziom trudności</label>
                            <select className="w-full border p-2 rounded"
                                value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                                <option value="easy">Łatwy</option>
                                <option value="medium">Średni</option>
                                <option value="hard">Trudny</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Link do YouTube (Wideo)</label>
                        <input className="w-full border p-2 rounded" placeholder="https://youtube.com/..." 
                            value={formData.youtubeLink} onChange={e => setFormData({...formData, youtubeLink: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Link do Dysku Google / PDF (Nuty)</label>
                        <input className="w-full border p-2 rounded" placeholder="https://drive.google.com/..." 
                            value={formData.driveLink} onChange={e => setFormData({...formData, driveLink: e.target.value})} />
                    </div>

                    <div>
                         <label className="block text-sm font-medium mb-1">Opis / Uwagi</label>
                         <textarea className="w-full border p-2 rounded h-24" placeholder="Opis choreografii, uwagi dla muzyków..."
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Anuluj</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                            {loading ? "Zapisywanie..." : "Zapisz"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}