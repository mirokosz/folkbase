import React, { useState, useEffect } from 'react';
import { addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Shirt, Plus, Loader2, Edit, Trash2, ShoppingBag, AlertCircle } from 'lucide-react';

// Importujemy typy danych (poprawna ścieżka względna z 'modules/' do 'types/')
import type { CostumeType, CostumeItem, Member } from '../types/data';
// Importujemy funkcje Firebase (poprawna ścieżka względna z 'modules/' do 'src/')
import { getTeamCollectionRef, getTeamDocRef } from '../firebase';
// Importujemy komponent Modal (poprawna ścieżka względna)
import Modal from '../components/common/Modal';

// --- Komponent Modalu Typu Stroju ---
interface CostumeTypeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    currentType?: CostumeType | null;
}

const CostumeTypeFormModal: React.FC<CostumeTypeFormModalProps> = ({ isOpen, onClose, teamId, currentType = null }) => {
    const [name, setName] = useState(currentType?.name || '');
    const [description, setDescription] = useState(currentType?.description || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(currentType?.name || '');
            setDescription(currentType?.description || '');
        }
    }, [isOpen, currentType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const costumeTypeData = { name, description, teamId, updatedAt: serverTimestamp() };

        try {
            if (currentType) {
                await updateDoc(getTeamDocRef(teamId, 'costumes', currentType.id), costumeTypeData);
            } else {
                await addDoc(getTeamCollectionRef(teamId, 'costumes'), { ...costumeTypeData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (error) {
            console.error("Błąd zapisu typu stroju:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={currentType ? 'Edytuj Typ Stroju' : 'Dodaj Nowy Typ Stroju'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="typeName" className="block text-sm font-medium text-gray-700">Nazwa Stroju (np. Krakowski)</label>
                        <input id="typeName" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Opis/Uwagi</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" disabled={loading}>Anuluj</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center" disabled={loading || !name}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {currentType ? 'Zapisz Zmiany' : 'Dodaj Typ'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- Komponent Modalu Elementu Stroju ---
interface CostumeItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    costumeTypes: CostumeType[];
    members: Member[];
    currentItem?: CostumeItem | null;
}

const CostumeItemFormModal: React.FC<CostumeItemFormModalProps> = ({ isOpen, onClose, teamId, costumeTypes, members, currentItem = null }) => {
    const [costumeTypeId, setCostumeTypeId] = useState(currentItem?.costumeTypeId || (costumeTypes.length > 0 ? costumeTypes[0].id : ''));
    const [name, setName] = useState(currentItem?.name || ''); // Np. "Koszula Męska"
    const [size, setSize] = useState(currentItem?.size || ''); // Np. "M", "12A"
    const [assignedTo, setAssignedTo] = useState(currentItem?.assignedTo || ''); // ID członka
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCostumeTypeId(currentItem?.costumeTypeId || (costumeTypes.length > 0 ? costumeTypes[0].id : ''));
            setName(currentItem?.name || '');
            setSize(currentItem?.size || '');
            setAssignedTo(currentItem?.assignedTo || '');
        }
    }, [isOpen, currentItem, costumeTypes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const assignedMember = members.find(m => m.id === assignedTo);
        const itemData = {
            costumeTypeId,
            name,
            size,
            isAvailable: !assignedTo,
            assignedTo: assignedTo || null,
            assignedToName: assignedMember ? assignedMember.name : null, // Denormalizacja
            teamId,
            updatedAt: serverTimestamp(),
        };

        try {
            if (currentItem) {
                await updateDoc(getTeamDocRef(teamId, 'costumeItems', currentItem.id), itemData);
            } else {
                await addDoc(getTeamCollectionRef(teamId, 'costumeItems'), { ...itemData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (error) {
            console.error("Błąd zapisu elementu stroju:", error);
        } finally {
            setLoading(false);
        }
    };

    if (costumeTypes.length === 0 && isOpen) {
        return <Modal isOpen={isOpen} onClose={onClose} title="Brak Typów Strojów">
            <p className="text-red-600">Najpierw musisz dodać co najmniej jeden Typ Stroju (np. "Strój Krakowski").</p>
            <div className="mt-4 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Zamknij</button>
            </div>
        </Modal>
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={currentItem ? 'Edytuj Element Stroju' : 'Dodaj Nowy Element Stroju'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="costumeType" className="block text-sm font-medium text-gray-700">Typ Stroju (Kategoria)</label>
                        <select id="costumeType" value={costumeTypeId} onChange={(e) => setCostumeTypeId(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white">
                            {costumeTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Nazwa Elementu</label>
                            <input id="itemName" type="text" placeholder='np. Kamizelka' value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                        </div>
                        <div>
                            <label htmlFor="itemSize" className="block text-sm font-medium text-gray-700">Rozmiar/Numer</label>
                            <input id="itemSize" type="text" placeholder='np. M / 12A' value={size} onChange={(e) => setSize(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Przypisany do (Opcjonalnie)</label>
                        <select id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white">
                            <option value="">-- Dostępny (nikt nie przypisany) --</option>
                            {members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" disabled={loading}>Anuluj</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center" disabled={loading || !name || !size || !costumeTypeId}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {currentItem ? 'Zapisz Zmiany' : 'Dodaj Element'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- Główny Komponent Modułu Strojów ---
interface CostumesModuleProps {
    costumeTypes: CostumeType[];
    costumeItems: CostumeItem[];
    members: Member[];
    teamId: string;
}

const CostumesModule: React.FC<CostumesModuleProps> = ({ costumeTypes, costumeItems, members, teamId }) => {
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<CostumeType | null>(null);
    const [itemToEdit, setItemToEdit] = useState<CostumeItem | null>(null);

    const openTypeModal = (type: CostumeType | null = null) => {
        setTypeToEdit(type);
        setIsTypeModalOpen(true);
    };

    const openItemModal = (item: CostumeItem | null = null) => {
        setItemToEdit(item);
        setIsItemModalOpen(true);
    };

    const handleDeleteType = async (typeId: string, typeName: string) => {
        // Walidacja: nie można usunąć typu, jeśli są do niego przypisane elementy
        const itemsCount = costumeItems.filter(item => item.costumeTypeId === typeId).length;
        if (itemsCount > 0) {
            // Używamy `window.alert`, ale w projekcie inżynierskim lepiej zastąpić to niestandardowym modalem
            alert(`Nie można usunąć typu stroju "${typeName}", ponieważ ma przypisane ${itemsCount} elementy. Usuń najpierw wszystkie elementy.`);
            return;
        }
        if (!confirm(`Czy na pewno usunąć typ stroju: ${typeName}?`)) return;
        try {
            await deleteDoc(getTeamDocRef(teamId, 'costumes', typeId));
        } catch (error) {
            console.error("Błąd usuwania typu stroju:", error);
        }
    };

    const handleDeleteItem = async (itemId: string, itemName: string) => {
        if (!confirm(`Czy na pewno usunąć element stroju: ${itemName}?`)) return;
        try {
            await deleteDoc(getTeamDocRef(teamId, 'costumeItems', itemId));
        } catch (error) {
            console.error("Błąd usuwania elementu stroju:", error);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg h-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <Shirt className="w-7 h-7 mr-3 text-indigo-600" /> Zarządzanie Strojem Scenicznym
            </h1>

            {/* Sekcja Typów Strojów (Kategorie) */}
            <div className="mb-8 p-4 bg-indigo-50 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-indigo-800 flex items-center"><ShoppingBag className="w-5 h-5 mr-2"/> Typy Strojów</h2>
                    <button onClick={() => openTypeModal()} className="flex items-center bg-indigo-600 text-white px-3 py-1 text-sm rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                        <Plus className="w-4 h-4 mr-1" /> Dodaj Typ
                    </button>
                </div>
                <div className="flex flex-wrap gap-3">
                    {costumeTypes.length === 0 ? (
                        <p className="text-indigo-700 italic">Brak zdefiniowanych typów strojów (np. Strój Krakowski, Strój Lubelski).</p>
                    ) : (
                        costumeTypes.map(type => (
                            <div key={type.id} className="flex items-center bg-white border border-indigo-200 rounded-full pl-4 pr-1 py-1 shadow-sm">
                                <span className="text-sm font-medium text-indigo-900">{type.name}</span>
                                <button onClick={() => openTypeModal(type)} className="ml-2 text-indigo-500 hover:text-indigo-700 p-1 rounded-full"><Edit className="w-3 h-3" /></button>
                                <button onClick={() => handleDeleteType(type.id, type.name)} className="text-red-500 hover:text-red-700 p-1 rounded-full"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Sekcja Elementów Strojów (Inwentarz) */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-1 flex items-center">
                Elementy Inwentarzowe ({costumeItems.length})
                <button onClick={() => openItemModal()} className="ml-4 flex items-center bg-green-600 text-white px-3 py-1 text-sm rounded-lg shadow-md hover:bg-green-700 transition-colors">
                    <Plus className="w-4 h-4 mr-1" /> Dodaj Element
                </button>
            </h2>

            {costumeTypes.length === 0 ? (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" /> Dodaj najpierw Typ Stroju, aby móc dodawać elementy inwentarzowe.
                </div>
            ) : (
                // Mapowanie przez Typy Strojów (Kategorie)
                costumeTypes.map(type => {
                    const itemsForType = costumeItems.filter(item => item.costumeTypeId === type.id);
                    const availableCount = itemsForType.filter(item => item.isAvailable).length;
                    const totalCount = itemsForType.length;

                    return (
                        <div key={type.id} className="mb-6 border border-gray-200 rounded-xl overflow-hidden shadow-md">
                            <div className="p-4 bg-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-700">{type.name}</h3>
                                <div className="text-sm">
                                    <span className="font-semibold text-green-600">{availableCount}</span> / <span className="text-gray-500">{totalCount}</span> dostępne
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Element</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rozmiar/Numer</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Przypisany do</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {itemsForType.length === 0 ? (
                                            <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-500 italic">Brak elementów dla tego typu stroju.</td></tr>
                                        ) : (
                                            itemsForType.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{item.size}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {item.assignedToName ? (
                                                            <span className="font-medium text-indigo-700">{item.assignedToName}</span>
                                                        ) : (
                                                            <span className="text-green-600">Dostępny</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm">
                                                        <button onClick={() => openItemModal(item)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100" title="Edytuj"><Edit className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteItem(item.id, item.name)} className="ml-1 text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100" title="Usuń"><Trash2 className="w-4 h-4" /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })
            )}

            <CostumeTypeFormModal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} teamId={teamId} currentType={typeToEdit} />
            <CostumeItemFormModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} teamId={teamId} costumeTypes={costumeTypes} members={members} currentItem={itemToEdit} />
        </div>
    );
};

export default CostumesModule;