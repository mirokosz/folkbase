import { useEffect, useState, useCallback } from "react";
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, increment, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "../../services/firebase";
import { Costume, CostumeAssignment } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { toDate } from "../../utils/dates";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
// ZMIANA: Usunięto 'Trash2' z importów
import { Shirt, Plus, RefreshCw, PackageOpen, AlertCircle } from "lucide-react";

interface CostumeManagerProps {
    memberId: string;
}

export default function CostumeManager({ memberId }: CostumeManagerProps) {
    const { profile } = useAuth();
    const [assignments, setAssignments] = useState<CostumeAssignment[]>([]);
    const [availableCostumes, setAvailableCostumes] = useState<Costume[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    
    const [selectedCostumeId, setSelectedCostumeId] = useState("");
    const [notes, setNotes] = useState("");

    const canManage = profile?.role === 'admin' || profile?.role === 'instructor';

    // ZMIANA: Używamy useCallback, aby funkcja była stabilna (naprawa ostrzeżenia useEffect)
    const fetchAssignments = useCallback(async () => {
        const q = query(collection(db, "teams", "folkbase", "members", memberId, "assignments"), orderBy("assignedDate", "desc"));
        const snap = await getDocs(q);
        setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() } as CostumeAssignment)));
        setLoading(false);
    }, [memberId]);

    const fetchCostumes = async () => {
        const q = query(collection(db, "teams", "folkbase", "costumes"), orderBy("name"));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Costume));
        setAvailableCostumes(all.filter(c => c.quantity > 0));
    };

    // ZMIANA: Dodano fetchAssignments do tablicy zależności
    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const handleAssign = async () => {
        if (!selectedCostumeId) return;
        
        const costume = availableCostumes.find(c => c.id === selectedCostumeId);
        if (!costume) return;

        try {
            await addDoc(collection(db, "teams", "folkbase", "members", memberId, "assignments"), {
                costumeId: costume.id,
                costumeName: costume.name,
                assignedDate: serverTimestamp(),
                notes: notes
            });

            await updateDoc(doc(db, "teams", "folkbase", "costumes", costume.id!), {
                quantity: increment(-1)
            });

            alert("Wydano strój!");
            setIsAssigning(false);
            setNotes("");
            setSelectedCostumeId("");
            fetchAssignments();
        } catch (error) {
            console.error(error);
            alert("Błąd podczas wydawania.");
        }
    };

    const handleReturn = async (assignment: CostumeAssignment) => {
        if (!confirm(`Czy potwierdzasz zwrot: ${assignment.costumeName}?`)) return;

        try {
            await deleteDoc(doc(db, "teams", "folkbase", "members", memberId, "assignments", assignment.id));

            await updateDoc(doc(db, "teams", "folkbase", "costumes", assignment.costumeId), {
                quantity: increment(1)
            });

            fetchAssignments();
        } catch (error) {
            console.error(error);
            alert("Błąd podczas zwrotu.");
        }
    };

    if (loading) return <div className="p-4 text-sm text-gray-500 dark:text-slate-400">Ładowanie ekwipunku...</div>;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Shirt size={20} className="text-indigo-600 dark:text-indigo-400" /> 
                    Ekwipunek
                </h3>
                {canManage && !isAssigning && (
                    <button 
                        onClick={() => { setIsAssigning(true); fetchCostumes(); }}
                        className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center gap-1"
                    >
                        <Plus size={14} /> Wydaj
                    </button>
                )}
            </div>

            {isAssigning && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">Wydawanie stroju z magazynu</h4>
                    
                    <div className="space-y-3">
                        <select 
                            className="w-full border dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedCostumeId}
                            onChange={e => setSelectedCostumeId(e.target.value)}
                        >
                            <option value="">-- Wybierz strój --</option>
                            {availableCostumes.map(c => (
                                <option key={c.id} value={c.id!}>
                                    {c.name} (Dostępne: {c.quantity}) {c.sizeRange}
                                </option>
                            ))}
                        </select>

                        <input 
                            placeholder="Uwagi (np. stan stroju, braki)"
                            className="w-full border dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-lg p-2 text-sm outline-none"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAssigning(false)} className="px-3 py-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 font-medium">Anuluj</button>
                            <button 
                                onClick={handleAssign} 
                                disabled={!selectedCostumeId}
                                className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
                            >
                                Potwierdź
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {assignments.length > 0 ? (
                <div className="space-y-3">
                    {assignments.map(assign => (
                        <div key={assign.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                                    <PackageOpen size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white">{assign.costumeName}</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">
                                        Wydano: {format(toDate(assign.assignedDate), "d MMM yyyy", { locale: pl })}
                                    </p>
                                    {assign.notes && <p className="text-xs text-orange-500 mt-0.5 flex items-center gap-1"><AlertCircle size={10}/> {assign.notes}</p>}
                                </div>
                            </div>

                            {canManage && (
                                <button 
                                    onClick={() => handleReturn(assign)}
                                    className="p-2 text-gray-300 dark:text-slate-600 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                                    title="Zwróć do magazynu"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-xl">
                    <p className="text-sm text-gray-400 dark:text-slate-500">Brak przypisanych strojów.</p>
                </div>
            )}
        </div>
    );
}