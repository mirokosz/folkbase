import React, { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { uploadCostumeImage } from "../../services/mediaService";
import { Costume } from "../../types";
import { useAuth } from "../../context/AuthContext";
// USUNIĘTO 'Image as ImageIcon', aby naprawić błąd "defined but never used"
import { Plus, Shirt, Trash2, Pencil, Package, ExternalLink, UploadCloud, X, Loader2 } from "lucide-react";

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
            <CostumeCard 
                key={item.id} 
                item={item} 
                canManage={canManage} 
                onEdit={() => openEditModal(item)} 
                onDelete={() => item.id && handleDelete(item.id)} 
            />
        ))}
      </div>

      {costumes.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
              <Shirt size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">Magazyn jest pusty.</p>
              {canManage && <p className="text-sm mt-1">Dodaj pierwszy strój przyciskiem powyżej.</p>}
          </div>
      )}

      {isModalOpen && <CostumeModal onClose={() => setIsModalOpen(false)} initialData={editingItem} />}
    </div>
  );
}

function CostumeCard({ item, canManage, onEdit, onDelete }: { item: Costume, canManage: boolean, onEdit: () => void, onDelete: () => void }) {
    const GenderBadge = ({ gender }: { gender: string }) => {
        if (gender === 'female') return <span className="text-[10px] uppercase font-bold text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-300 px-2 py-1 rounded-full shadow-sm">Damski</span>;
        if (gender === 'male') return <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full shadow-sm">Męski</span>;
        return <span className="text-[10px] uppercase font-bold text-gray-600 bg-gray-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded-full shadow-sm">Unisex</span>;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition group relative flex flex-col h-full">
            
            <div className="h-56 bg-gray-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center group/image">
                {item.imageUrl ? (
                    <>
                        <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <a 
                            href={item.imageUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition duration-300 cursor-pointer backdrop-blur-[2px]"
                        >
                            <div className="bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/30 flex items-center gap-2 text-sm font-bold hover:bg-white/30 transition">
                                <ExternalLink size={16} /> Zobacz
                            </div>
                        </a>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-300 dark:text-slate-600 p-4 text-center">
                        <Shirt size={48} strokeWidth={1.5} />
                        <span className="text-[10px] mt-2 font-medium uppercase tracking-widest opacity-60">Brak zdjęcia</span>
                    </div>
                )}
                <div className="absolute top-3 right-3 z-10 pointer-events-none">
                    <GenderBadge gender={item.gender} />
                </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
                <div className="flex-1">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-1 truncate" title={item.name}>{item.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mb-4">
                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-mono border border-gray-200 dark:border-slate-600">
                            Rozm: {item.sizeRange}
                        </span>
                        <span className="text-xs opacity-60">{item.type === 'set' ? 'Komplet' : item.type === 'element' ? 'Element' : 'Dodatek'}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-slate-700 mt-auto">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg">
                        <Package size={18} className="text-indigo-500" />
                        <span>{item.quantity} szt.</span>
                    </div>
                    
                    {canManage && (
                        <div className="flex gap-1">
                            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition" title="Edytuj">
                                <Pencil size={18}/>
                            </button>
                            <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Usuń">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CostumeModal({ onClose, initialData }: { onClose: () => void, initialData: Costume | null }) {
    const [formData, setFormData] = useState({
        name: '', type: 'set', gender: 'female', sizeRange: '', quantity: 1, imageUrl: '', description: ''
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadCostumeImage(file);
            setFormData(prev => ({ ...prev, imageUrl: url }));
        } catch (error) {
            console.error("Upload error:", error);
            alert("Błąd podczas wysyłania zdjęcia.");
        } finally {
            setUploading(false);
        }
    };

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

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, imageUrl: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-100 dark:border-slate-700 my-8">
                <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                    {initialData ? <Pencil size={20}/> : <Plus size={20}/>}
                    {initialData ? "Edytuj strój" : "Dodaj nowy strój"}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* SEKCJA WGRYWANIA ZDJĘCIA */}
                    <div className="flex flex-col items-center justify-center mb-4">
                        {/* NAPRAWA: Usunięto warunkowe 'hidden' i 'flex', teraz struktura jest czystsza */}
                        <div className="relative w-full h-48 bg-gray-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex flex-col items-center justify-center overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                            
                            {uploading ? (
                                <div className="flex flex-col items-center text-indigo-600 dark:text-indigo-400">
                                    <Loader2 size={32} className="animate-spin mb-2" />
                                    <span className="text-xs font-bold">Wgrywanie...</span>
                                </div>
                            ) : formData.imageUrl ? (
                                <>
                                    <img src={formData.imageUrl} alt="Podgląd" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-200">
                                        <button 
                                            type="button" 
                                            onClick={handleRemoveImage}
                                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 flex items-center gap-1 shadow-lg"
                                        >
                                            <X size={14} /> Usuń zdjęcie
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6 cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                                    <UploadCloud size={32} className="mx-auto text-gray-400 mb-2 hover:text-indigo-500 transition-colors" />
                                    <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Kliknij, aby wgrać zdjęcie</p>
                                    <p className="text-[10px] text-gray-400 mt-1">PNG, JPG</p>
                                </div>
                            )}
                            
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 block">Nazwa stroju</label>
                        <input required className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder="np. Gorset krakowski"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 block">Płeć</label>
                            <select className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                <option value="female">Damski</option>
                                <option value="male">Męski</option>
                                <option value="unisex">Unisex</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 block">Typ</label>
                            <select className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                <option value="set">Cały Komplet</option>
                                <option value="element">Pojedynczy Element</option>
                                <option value="accessory">Dodatek / Rekwizyt</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 block">Rozmiarówka</label>
                            <input required className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition" value={formData.sizeRange} onChange={e => setFormData({...formData, sizeRange: e.target.value})} placeholder="np. 36-42 lub S-L"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 block">Ilość</label>
                            <input type="number" required className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition">Anuluj</button>
                        <button type="submit" disabled={uploading} className="px-5 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {uploading ? "Wgrywanie..." : "Zapisz"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}