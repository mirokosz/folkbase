import React, { useState, useEffect } from 'react';
import { addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Users, Plus, Loader2, Edit, Trash2 } from 'lucide-react';

// Importujemy definicję typu 'Member'
// Używamy "import type", aby naprawić błąd ts(1484)
import type { Member } from '../types/data';
// Importujemy stałe
import { MEMBER_ROLES } from '../config/constants';
// Importujemy funkcje pomocnicze Firebase
import { getTeamCollectionRef, getTeamDocRef } from '../firebase';
// Importujemy nasz wspólny komponent Modal
import Modal from '../components/common/Modal';

// --- Komponent Wewnętrzny: Modal Formularza Członka ---
interface MemberFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    currentMember?: Member | null;
}

const MemberFormModal: React.FC<MemberFormModalProps> = ({ isOpen, onClose, teamId, currentMember = null }) => {
    const [name, setName] = useState(currentMember?.name || '');
    const [role, setRole] = useState(currentMember?.role || MEMBER_ROLES[0]);
    const [isInstructor, setIsInstructor] = useState(currentMember?.isInstructor || false);
    const [loading, setLoading] = useState(false);

    // Resetuj formularz, gdy modal jest otwierany
    useEffect(() => {
        if (isOpen) {
            setName(currentMember?.name || '');
            setRole(currentMember?.role || MEMBER_ROLES[0]);
            setIsInstructor(currentMember?.isInstructor || false);
            setLoading(false); // Zresetuj stan ładowania
        }
    }, [isOpen, currentMember]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const memberData = {
            name,
            role,
            isInstructor,
            teamId, // Dodajemy teamId dla reguł bezpieczeństwa
            updatedAt: serverTimestamp(),
        };

        try {
            if (currentMember) {
                // Edycja
                await updateDoc(getTeamDocRef(teamId, 'members', currentMember.id), memberData);
            } else {
                // Dodawanie
                await addDoc(getTeamCollectionRef(teamId, 'members'), { ...memberData, createdAt: serverTimestamp() });
            }
            onClose(); // Zamknij modal po sukcesie
        } catch (error) {
            console.error("Błąd zapisu danych członka:", error);
            // TODO: Pokaż błąd użytkownikowi
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={currentMember ? 'Edytuj Członka Zespołu' : 'Dodaj Nowego Członka'}
        >
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Imię i Nazwisko</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Główna Rola</label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white"
                        >
                            {MEMBER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="isInstructor"
                            type="checkbox"
                            checked={isInstructor}
                            onChange={(e) => setIsInstructor(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isInstructor" className="ml-2 block text-sm font-medium text-gray-700">
                            Pełni funkcję Instruktora/Wychowawcy
                        </label>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        disabled={loading}
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center"
                        disabled={loading || !name}
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {currentMember ? 'Zapisz Zmiany' : 'Dodaj Członka'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


// --- Główny Komponent Modułu Członków ---
interface MembersModuleProps {
    members: Member[];
    teamId: string;
}

/**
 * Moduł zarządzania Członkami Zespołu (CRUD).
 * Otrzymuje listę członków i teamId jako propsy z głównego pliku App.tsx.
 */
const MembersModule: React.FC<MembersModuleProps> = ({ members, teamId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

    const handleAddMember = () => {
        setMemberToEdit(null); // Upewnij się, że modal jest w trybie "dodawania"
        setIsModalOpen(true);
    };

    const handleEditMember = (member: Member) => {
        setMemberToEdit(member); // Ustaw członka do edycji
        setIsModalOpen(true);
    };
    
    const handleDeleteMember = async (memberId: string, memberName: string) => {
        // Używamy prostego 'confirm' zamiast modala
        if (!confirm(`Czy na pewno chcesz usunąć członka: ${memberName}? Ta operacja jest nieodwracalna.`)) {
            return;
        }

        try {
            await deleteDoc(getTeamDocRef(teamId, 'members', memberId));
            console.log(`Członek ${memberName} usunięty pomyślnie.`);
        } catch (error) {
            console.error("Błąd podczas usuwania członka:", error);
            // TODO: Pokaż błąd użytkownikowi
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg h-full">
            {/* Nagłówek Modułu */}
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <Users className="w-7 h-7 mr-3 text-indigo-600" /> Zarządzanie Członkami Zespołu
            </h1>
            <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">{members.length} {members.length === 1 ? 'członek' : members.length < 5 ? 'członków' : 'członków'} w zespole.</p>
                <button
                    onClick={handleAddMember}
                    className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" /> Dodaj Członka
                </button>
            </div>

            {/* Tabela Członków */}
            <div className="overflow-x-auto bg-gray-50 rounded-xl shadow-inner">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imię i Nazwisko</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rola Główna</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                    Brak członków w zespole. Kliknij "Dodaj Członka", aby rozpocząć!
                                </td>
                            </tr>
                        ) : (
                            members.map((member) => (
                                <tr key={member.id} className="hover:bg-indigo-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                                        {member.isInstructor ? (
                                            <span className="text-green-600 font-semibold">Instruktor</span>
                                        ) : (
                                            <span className="text-gray-500">Członek</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEditMember(member)}
                                            className="text-indigo-600 hover:text-indigo-900 p-2 transition-colors rounded-full hover:bg-indigo-100"
                                            title="Edytuj"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMember(member.id, member.name)}
                                            className="ml-2 text-red-600 hover:text-red-900 p-2 transition-colors rounded-full hover:bg-red-100"
                                            title="Usuń"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Renderowanie Modala */}
            <MemberFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teamId={teamId}
                currentMember={memberToEdit}
            />
        </div>
    );
};

export default MembersModule;