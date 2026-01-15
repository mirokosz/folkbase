import React, { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { RepertoireItem } from "../../types";
import { getYouTubeThumbnail } from "../../utils/youtube";
import { useAuth } from "../../context/AuthContext";
import { Plus, Music2, Video, FileText, ExternalLink, PlayCircle, Pencil, Trash2 } from "lucide-react";

export default function Repertoire() {
  const { profile } = useAuth();
  const [items, setItems] = useState<RepertoireItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RepertoireItem | null>(null);

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
      } catch (error) { console.error(error); alert("Błąd."); }
  };

  const openEditModal = (item: RepertoireItem) => { setEditingItem(item); setIsModalOpen(true); };
  const openAddModal = () => { setEditingItem(null); setIsModalOpen(true); };

  const DifficultyBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
      easy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      hard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    };
    const labels: Record<string, string> = { easy: "Łatwy", medium: "Średni", hard: "Trudny" };
    return <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[level] || "bg-gray-100"}`}>{labels[level] || level}</span>;
  };

  const TypeIcon = ({ type }: { type: string }) => {
     if (type === 'song') return <Music2 size={16} className="text-pink-500 dark:text-pink-400" />;
     if (type === 'dance') return <Video size={16} className="text-indigo-500 dark:text-indigo-400" />;
     return <Music2 size={16} className="text-blue-500 dark:text-blue-400" />;
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-slate-400">Ładowanie repertuaru...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Repertuar</h1>
           <p className="text-gray-500 dark:text-slate-400">Choreografie, pieśni i nuty zespołu.</p>
        </div>
        {canManage && (
            <button onClick={openAddModal} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm">
            <Plus size={20} /> Dodaj Utwór
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
            const thumbnail = item.youtubeLink ? getYouTubeThumbnail(item.youtubeLink) : null;
            
            return (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition group relative">
                    
                    {canManage && (
                        <div className="absolute top-2 left-2 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(item); }} className="bg-white dark:bg-slate-700 p-2 rounded-full text-gray-700 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 shadow-md transition" title="Edytuj">
                                <Pencil size={18} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); if (item.id) handleDelete(item.id); }} className="bg-white dark:bg-slate-700 p-2 rounded-full text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-red-400 shadow-md transition" title="Usuń">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}

                    <div className="h-40 bg-gray-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center">
                        {thumbnail ? (
                            <>
                                <img src={thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <PlayCircle size={48} className="text-white drop-shadow-lg" />
                                </div>
                                <a href={item.youtubeLink} target="_blank" rel="noreferrer" className="absolute inset-0 z-10"></a>
                            </>
                        ) : (
                            <div className="text-gray-400 dark:text-slate-600 flex flex-col items-center">
                                <Music2 size={48} className="mb-2 opacity-20" />
                                <span className="text-xs uppercase tracking-widest opacity-50">Brak wideo</span>
                            </div>
                        )}
                        <div className="absolute top-2 right-2 z-20">
                             <DifficultyBadge level={item.difficulty} />
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TypeIcon type={item.type} />
                            <span className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400 tracking-wide">{item.type === 'dance' ? 'Taniec' : item.type === 'song' ? 'Pieśń' : 'Muzyka'}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 min-h-[2.5rem]">{item.description || "Brak dodatkowego opisu."}</p>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-3 relative z-30">
                            {item.driveLink && (
                                <a href={item.driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                    <FileText size={16} /> Nuty/Opis
                                </a>
                            )}
                            {item.youtubeLink && (
                                <a href={item.youtubeLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline ml-auto">
                                    <ExternalLink size={16} /> YouTube
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )
        })}
      </div>

      {isModalOpen && <RepertoireModal initialData={editingItem} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

function RepertoireModal({ onClose, initialData }: { onClose: () => void, initialData: RepertoireItem | null }) {
    const [formData, setFormData] = useState({ 
        title: '', type: 'dance', difficulty: 'medium', youtubeLink: '', driveLink: '', description: '' 
    });
    const [loading, setLoading] = useState(false);

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
                const docRef = doc(db, "teams", "folkbase", "repertoire", initialData.id);
                await updateDoc(docRef, { ...formData });
            } else {
                await addDoc(collection(db, "teams", "folkbase", "repertoire"), { ...formData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (err) { console.error(err); alert("Błąd zapisu."); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                    {initialData ? "Edytuj utwór" : "Dodaj do repertuaru"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Tytuł</label>
                        <input className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500" required 
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Typ</label>
                            <select className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500"
                                value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                <option value="dance">Taniec</option>
                                <option value="song">Pieśń</option>
                                <option value="music">Utwór Kapeli</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Poziom trudności</label>
                            <select className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500"
                                value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                                <option value="easy">Łatwy</option>
                                <option value="medium">Średni</option>
                                <option value="hard">Trudny</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Link do YouTube</label>
                        <input className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500" 
                            value={formData.youtubeLink} onChange={e => setFormData({...formData, youtubeLink: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Link do Dysku Google / PDF</label>
                        <input className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500" 
                            value={formData.driveLink} onChange={e => setFormData({...formData, driveLink: e.target.value})} />
                    </div>

                    <div>
                         <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Opis / Uwagi</label>
                         <textarea className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white p-2 rounded h-24 outline-none focus:ring-2 focus:ring-indigo-500" 
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition">Anuluj</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
                            {loading ? "Zapisywanie..." : "Zapisz"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}