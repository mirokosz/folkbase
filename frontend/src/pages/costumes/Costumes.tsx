import React, { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { Costume } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { Plus, Shirt, Trash2, Pencil, Package } from "lucide-react";

export default function Costumes() {
  const { profile } = useAuth();
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Costume | null>(null);

  const canManage = profile?.role === 'admin' || profile?.role === 'instructor';

  useEffect(() => {
    const q = query(collection(db, "teams", "folkbase", "costumes"), orderBy("name"));
    const unsub = onSnapshot(q, (snapshot) => {
      setCostumes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Costume)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredCostumes = costumes.filter(c => {
      if (filter === 'all') return true;
      return c.gender === filter;
  });

  const handleDelete = async (id: string) => {
      if (!window.confirm("Usunąć ten strój z magazynu?")) return;
      await deleteDoc(doc(db, "teams", "folkbase", "costumes", id));
  };

  const openAddModal = () => { setEditingItem(null); setIsModalOpen(true); };
  const openEditModal = (item: Costume) => { setEditingItem(item); setIsModalOpen(true); };

  const GenderBadge = ({ gender }: { gender: string }) => {
      if (gender === 'female') return <span className="text-[10px] uppercase font-bold text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-300 px-2 py-1 rounded-full">Damski</span>;
      if (gender === 'male') return <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full">Męski</span>;
      return <span className="text-[10px] uppercase font-bold text-gray-600 bg-gray-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded-full">Unisex</span>;
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-slate-400">Ładowanie magazynu...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Magazyn Strojów</h1>
           <p className="text-gray-500 dark:text-slate-400">Zarządzaj inwentarzem i stanem strojów.</p>
        </div>
        {canManage && (
            <button onClick={openAddModal} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition">
                <Plus size={20} /> Dodaj Strój
            </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700 pb-4">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>Wszystkie</button>
          <button onClick={() => setFilter('female')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${filter === 'female' ? 'bg-pink-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-pink-900/20'}`}>Damskie</button>
          <button onClick={() => setFilter('male')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${filter === 'male' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>Męskie</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCostumes.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition group relative">
                
                <div className="h-48 bg-gray-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                        <Shirt size={48} className="text-gray-300 dark:text-slate-600" />
                    )}
                    <div className="absolute top-2 right-2">
                        <GenderBadge gender={item.gender} />
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-1">{item.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mb-4">
                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-mono">Rozm: {item.sizeRange}</span>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-medium">
                            <Package size={18} className="text-indigo-500" />
                            <span>{item.quantity} szt.</span>
                        </div>
                        
                        {canManage && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => openEditModal(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"><Pencil size={16}/></button>
                                <button onClick={() => item.id && handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={16}/></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>

      {costumes.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
              <Shirt size={48} className="mx-auto mb-3 opacity-20" />
              <p>Magazyn jest pusty.</p>
          </div>
      )}

      {isModalOpen && <CostumeModal onClose={() => setIsModalOpen(false)} initialData={editingItem} />}
    </div>
  );
}

function CostumeModal({ onClose, initialData }: { onClose: () => void, initialData: Costume | null }) {
    const [formData, setFormData] = useState({
        name: '', type: 'set', gender: 'female', sizeRange: '', quantity: 1, imageUrl: '', description: ''
    });

    useEffect(() => {
        if(initialData) {
            setFormData({
                name: initialData.name,
                type: initialData.type,
                gender: initialData.gender,
                sizeRange: initialData.sizeRange,
                quantity: initialData.quantity,
                imageUrl: initialData.imageUrl || '',
                description: initialData.description || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData?.id) {
                await updateDoc(doc(db, "teams", "folkbase", "costumes", initialData.id), formData);
            } else {
                await addDoc(collection(db, "teams", "folkbase", "costumes"), { ...formData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (err) { console.error(err); alert("Błąd zapisu"); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-100 dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{initialData ? "Edytuj strój" : "Dodaj nowy strój"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Nazwa</label>
                        <input required className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Płeć</label>
                            <select className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                <option value="female">Damski</option>
                                <option value="male">Męski</option>
                                <option value="unisex">Unisex</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Typ</label>
                            <select className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                <option value="set">Cały Komplet</option>
                                <option value="element">Pojedynczy Element</option>
                                <option value="accessory">Dodatek / Rekwizyt</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Rozmiarówka</label>
                            <input required className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.sizeRange} onChange={e => setFormData({...formData, sizeRange: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Ilość</label>
                            <input type="number" required className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Link do zdjęcia</label>
                        <input className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition">Anuluj</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Zapisz</button>
                    </div>
                </form>
            </div>
        </div>
    );
}