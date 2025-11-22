import React, { useState, useEffect } from 'react';
import { addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, query, where, runTransaction, doc } from 'firebase/firestore';
import { Calendar, Plus, Loader2, Edit, Trash2, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

// Poprawka: Używamy 'import type' dla definicji typów
import type { Event, Member } from '../types/data';
// Poprawka: Poprawne ścieżki względne
import { EVENT_TYPES, ATTENDANCE_STATUSES } from '../config/constants';
import { getTeamCollectionRef, getTeamDocRef, db } from '../firebase';
import Modal from '../components/common/Modal';

// --- Komponent Wewnętrzny: Modal Formularza Wydarzenia ---
interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    currentEvent?: Event | null;
}

const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, teamId, currentEvent = null }) => {
    // Formatowanie daty dla input[type="datetime-local"]
    const formatDateTime = (date?: Date) => {
        if (!date) {
            // Domyślnie ustawia jutro o 18:00
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(18, 0, 0, 0);
            date = tomorrow;
        }
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // Korekta strefy czasowej
        return d.toISOString().slice(0, 16);
    };

    const [title, setTitle] = useState(currentEvent?.title || '');
    const [type, setType] = useState(currentEvent?.type || EVENT_TYPES[0]);
    const [location, setLocation] = useState(currentEvent?.location || '');
    const [date, setDate] = useState(formatDateTime(currentEvent?.date));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(currentEvent?.title || '');
            setType(currentEvent?.type || EVENT_TYPES[0]);
            setLocation(currentEvent?.location || '');
            setDate(formatDateTime(currentEvent?.date));
            setLoading(false);
        }
    }, [isOpen, currentEvent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const eventDate = new Date(date);
        const eventData = {
            title,
            type,
            location,
            date: eventDate, // Firestore sam przekonwertuje Date na Timestamp
            teamId,
            updatedAt: serverTimestamp(),
        };

        try {
            if (currentEvent) {
                await updateDoc(getTeamDocRef(teamId, 'events', currentEvent.id), eventData);
            } else {
                await addDoc(getTeamCollectionRef(teamId, 'events'), { ...eventData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (error) {
            console.error("Błąd zapisu wydarzenia:", error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={currentEvent ? 'Edytuj Wydarzenie' : 'Zaplanuj Nowe Wydarzenie'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Tytuł/Temat</label>
                        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Typ Wydarzenia</label>
                        <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white">
                            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data i Godzina</label>
                            <input id="date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Lokalizacja</label>
                            <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" disabled={loading}>Anuluj</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center" disabled={loading || !title || !date || !location}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {currentEvent ? 'Zapisz Zmiany' : 'Zaplanuj Wydarzenie'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- Komponent Wewnętrzny: Modal Listy Obecności ---
interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
    members: Member[];
    teamId: string;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, event, members, teamId }) => {
    // Stan lokalny przechowujący { memberId: { status: 'Obecny', docId: '...' } }
    const [attendance, setAttendance] = useState<{ [key: string]: { status: string, docId?: string } }>({});
    const [loading, setLoading] = useState(false);

    // 1. Ładowanie aktualnej obecności przy otwarciu modala
    useEffect(() => {
        if (!isOpen || !event) return;

        const loadAttendance = async () => {
            setLoading(true);
            const q = query(getTeamCollectionRef(teamId, 'attendance'), where('eventId', '==', event.id));
            try {
                const snapshot = await getDocs(q);
                const currentAttendance: { [key: string]: { status: string, docId?: string } } = {};
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    currentAttendance[data.memberId] = { status: data.status, docId: doc.id };
                });
                setAttendance(currentAttendance);
            } catch (error) {
                console.error("Błąd ładowania listy obecności:", error);
            } finally {
                setLoading(false);
            }
        };
        loadAttendance();
    }, [isOpen, event, teamId]);

    // 2. Obsługa zmiany statusu w UI
    const handleStatusChange = (memberId: string, status: string) => {
        setAttendance(prev => ({
            ...prev,
            [memberId]: { ...prev[memberId], status: status }
        }));
    };

    // 3. Zapisywanie obecności (transakcja)
    const handleSaveAttendance = async () => {
        if (!event) return;
        setLoading(true);
        try {
            // Użycie transakcji dla atomowości zapisu
            await runTransaction(db, async (transaction) => {
                for (const member of members) {
                    const attData = attendance[member.id];
                    // Zapisz tylko jeśli status został ustawiony
                    if (attData && attData.status) {
                        const data = {
                            eventId: event.id,
                            memberId: member.id,
                            status: attData.status,
                            memberName: member.name, // Denormalizacja dla łatwiejszych raportów
                            eventDate: event.date,
                            updatedAt: serverTimestamp(),
                        };

                        if (attData.docId) {
                            // Aktualizacja istniejącego wpisu
                            transaction.update(getTeamDocRef(teamId, 'attendance', attData.docId), data);
                        } else {
                            // Tworzenie nowego wpisu
                            const newDocRef = doc(getTeamCollectionRef(teamId, 'attendance'));
                            transaction.set(newDocRef, { ...data, createdAt: serverTimestamp() });
                        }
                    }
                }
            });
            onClose();
        } catch (error) {
            console.error("Błąd zapisu obecności:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case ATTENDANCE_STATUSES.PRESENT: return "text-green-600 bg-green-100";
            case ATTENDANCE_STATUSES.ABSENT: return "text-red-600 bg-red-100";
            case ATTENDANCE_STATUSES.EXCUSED: return "text-yellow-600 bg-yellow-100";
            default: return "text-gray-600 bg-gray-100";
        }
    }

    const memberRows = members.sort((a, b) => a.name.localeCompare(b.name)).map(member => {
        const currentStatus = attendance[member.id]?.status || null;
        return (
            <tr key={member.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                <td className="px-4 py-3 text-sm hidden sm:table-cell">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(currentStatus)}`}>
                        {currentStatus || 'Brak Danych'}
                    </span>
                </td>
                <td className="px-4 py-3 text-sm space-x-2">
                    {Object.values(ATTENDANCE_STATUSES).map(status => (
                        <button key={status} onClick={() => handleStatusChange(member.id, status)} className={`p-2 text-xs rounded-lg transition-all border
                                ${currentStatus === status
                                    ? 'bg-indigo-600 text-white shadow-md border-indigo-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300'
                                }`} title={status}
                        >
                            {status === ATTENDANCE_STATUSES.PRESENT ? 'O' : status === ATTENDANCE_STATUSES.ABSENT ? 'N' : 'U'}
                        </button>
                    ))}
                </td>
            </tr>
        );
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Lista Obecności: ${event?.title || 'Wydarzenie'}`} maxWidth='max-w-xl'>
            <p className="text-sm text-gray-500 mb-4">
                Ustaw status obecności dla {members.length} członków.
            </p>
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Członek</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Aktualny Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Opcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin inline-block text-indigo-600" /></td></tr>
                        ) : memberRows}
                    </tbody>
                </table>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={handleSaveAttendance} className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md flex items-center" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Zapisz Listę Obecności
                </button>
            </div>
        </Modal>
    );
};

// --- Główny Komponent Modułu Kalendarza ---
interface CalendarModuleProps {
    events: Event[];
    members: Member[];
    teamId: string;
}

/**
 * Moduł zarządzania Kalendarzem i Obecnością.
 * Otrzymuje dane z App.tsx i zarządza logiką modali.
 */
const CalendarModule: React.FC<CalendarModuleProps> = ({ events, members, teamId }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
    const [eventForAttendance, setEventForAttendance] = useState<Event | null>(null);

    const openFormModal = (event: Event | null = null) => {
        setEventToEdit(event);
        setIsFormModalOpen(true);
    };

    const openAttendanceModal = (event: Event) => {
        setEventForAttendance(event);
        setIsAttendanceModalOpen(true);
    };

    const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
        if (!confirm(`Czy na pewno chcesz usunąć wydarzenie: ${eventTitle}?`)) return;
        try {
            // TODO: W pełnej wersji należałoby usunąć też powiązane wpisy 'attendance'
            await deleteDoc(getTeamDocRef(teamId, 'events', eventId));
            console.log(`Wydarzenie ${eventTitle} usunięte pomyślnie.`);
        } catch (error) {
            console.error("Błąd podczas usuwania wydarzenia:", error);
        }
    };

    // Sortowanie wydarzeń: nadchodzące na górze (od najbliższego), przeszłe na dole (od najnowszego)
    const now = new Date();
    const futureEvents = events.filter(e => e.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime());
    const pastEvents = events.filter(e => e.date < now).sort((a, b) => b.date.getTime() - a.date.getTime());

    const renderEvent = (event: Event) => (
        <div key={event.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800 truncate">{event.title}</h3>
                <div className="text-sm text-gray-500 space-y-1 mt-1">
                    <p className="flex items-center"><Clock className="w-4 h-4 mr-1 text-indigo-500" />
                        {event.date.toLocaleString('pl-PL', { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                    <p className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-indigo-500" />
                        {event.location}
                    </p>
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 mt-1">
                        {event.type}
                    </span>
                </div>
            </div>
            <div className="flex space-x-2 mt-2 sm:mt-0">
                <button onClick={() => openAttendanceModal(event)} className="flex items-center text-sm bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors" title="Zarządzaj Obecnością">
                    <CheckCircle className="w-4 h-4 mr-1" /> Obecność
                </button>
                <button onClick={() => openFormModal(event)} className="text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-100" title="Edytuj"><Edit className="w-5 h-5" /></button>
                <button onClick={() => handleDeleteEvent(event.id, event.title)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100" title="Usuń"><Trash2 className="w-5 h-5" /></button>
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg h-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <Calendar className="w-7 h-7 mr-3 text-indigo-600" /> Kalendarz Wydarzeń i Prób
            </h1>
            <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">Planuj próby, występy i zarządzaj listą obecności.</p>
                <button onClick={() => openFormModal(null)} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                    <Plus className="w-5 h-5 mr-2" /> Dodaj Wydarzenie
                </button>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-1">Nadchodzące Wydarzenia ({futureEvents.length})</h2>
            <div className="space-y-4 mb-8">
                {futureEvents.length > 0 ? futureEvents.map(renderEvent) : (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" /> Brak zaplanowanych nadchodzących wydarzeń.
                    </div>
                )}
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-1">Przeszłe Wydarzenia ({pastEvents.length})</h2>
            <div className="space-y-4 opacity-70">
                {pastEvents.length > 0 ? pastEvents.map(renderEvent) : (
                    <div className="p-4 bg-gray-100 text-gray-600 rounded-lg">
                        Brak archiwalnych wydarzeń.
                    </div>
                )}
            </div>

            {/* Renderowanie Modali */}
            <EventFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} teamId={teamId} currentEvent={eventToEdit} />
            <AttendanceModal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} event={eventForAttendance} members={members} teamId={teamId} />
        </div>
    );
};

export default CalendarModule;