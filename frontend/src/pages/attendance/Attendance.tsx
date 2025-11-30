import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { MemberProfile } from "../../types";
import { toDate } from "../../utils/dates";
import { format, isToday } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronRight, CheckCircle2, Circle, Users, ArrowLeft, QrCode } from "lucide-react";
import QRCode from "react-qr-code"; // <--- NOWY IMPORT

interface AttendanceEvent {
    id: string;
    title: string;
    type: string;
    startDate: any;
    attendees?: string[];
}

export default function Attendance() {
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AttendanceEvent | null>(null);
  
  // Stan dla modala z kodem QR
  const [showQR, setShowQR] = useState(false);

  // ... (tu bez zmian: useEffect do pobierania events i members) ...
  // Wklej te same useEffect co wcześniej
  useEffect(() => {
    const q = query(collection(db, "teams", "folkbase", "schedule"), orderBy("startDate", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
        const allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceEvent));
        setEvents(allEvents);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
        const q = query(collection(db, "teams", "folkbase", "members"), orderBy("lastName"));
        const snap = await getDocs(q);
        setMembers(snap.docs.map(d => ({id: d.id, ...d.data()} as MemberProfile)));
    };
    fetchMembers();
  }, []);

  const togglePresence = async (memberId: string) => {
      if (!selectedEvent) return;
      const currentAttendees = selectedEvent.attendees || [];
      let newAttendees;
      if (currentAttendees.includes(memberId)) {
          newAttendees = currentAttendees.filter(id => id !== memberId);
      } else {
          newAttendees = [...currentAttendees, memberId];
      }
      setSelectedEvent({ ...selectedEvent, attendees: newAttendees });
      try {
          await updateDoc(doc(db, "teams", "folkbase", "schedule", selectedEvent.id), { attendees: newAttendees });
      } catch (error) {
    console.error(error); // <--- Teraz zmienna jest używana
    alert("Błąd zapisu.");
}
  };

  const handleSelectAll = async () => {
      if (!selectedEvent) return;
      const allIds = members.map(m => m.uid!);
      const allPresent = allIds.every(id => selectedEvent.attendees?.includes(id));
      const newAttendees = allPresent ? [] : allIds;
      setSelectedEvent({ ...selectedEvent, attendees: newAttendees });
      await updateDoc(doc(db, "teams", "folkbase", "schedule", selectedEvent.id), { attendees: newAttendees });
  }

  // --- WIDOK 1: LISTA (BEZ ZMIAN) ---
  if (!selectedEvent) {
      return (
          <div className="space-y-6">
              <div>
                  <h1 className="text-2xl font-bold text-gray-800">Dziennik Obecności</h1>
                  <p className="text-gray-500">Wybierz wydarzenie, aby sprawdzić listę.</p>
              </div>
              <div className="grid gap-4">
                  {events.map(event => {
                      const date = toDate(event.startDate);
                      const isTodayEvent = isToday(date);
                      const presentCount = event.attendees?.length || 0;
                      return (
                          <div key={event.id} onClick={() => setSelectedEvent(event)} className={`bg-white p-4 rounded-xl border flex items-center justify-between cursor-pointer transition hover:shadow-md hover:-translate-y-0.5 ${isTodayEvent ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-indigo-100' : 'border-gray-200'}`}>
                              <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold ${isTodayEvent ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                      <span className="text-[10px] uppercase">{format(date, "MMM", {locale: pl})}</span>
                                      <span className="text-lg leading-none">{format(date, "d")}</span>
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-gray-800">{event.title}</h3>
                                      <p className="text-sm text-gray-500">{format(date, "EEEE, HH:mm", {locale: pl})}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                                      <Users size={14} className="text-gray-400" />
                                      <span className="text-sm font-medium text-gray-700">{presentCount}</span>
                                  </div>
                                  <ChevronRight size={20} className="text-gray-300 inline-block ml-2" />
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      );
  }

  // --- WIDOK 2: DETALE + GENERATOR QR ---
  const presentCount = selectedEvent.attendees?.length || 0;
  
  return (
      <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-gray-100 rounded-full transition"><ArrowLeft size={24} className="text-gray-600" /></button>
              <div className="flex-1">
                   <h2 className="text-xl font-bold text-gray-800">{selectedEvent.title}</h2>
                   <p className="text-gray-500 text-sm">{format(toDate(selectedEvent.startDate), "d MMMM, HH:mm", {locale: pl})}</p>
              </div>
              <div className="text-right">
                  <p className="text-xs uppercase font-bold text-gray-400">Obecni</p>
                  <p className="text-2xl font-bold text-indigo-600">{presentCount} <span className="text-gray-300 text-lg">/ {members.length}</span></p>
              </div>
          </div>

          <div className="flex gap-3">
              {/* PRZYCISK OTWIERAJĄCY QR KOD */}
              <button onClick={() => setShowQR(true)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 transition">
                  <QrCode size={20} /> WYŚWIETL KOD QR
              </button>
              <button onClick={handleSelectAll} className="px-6 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition">
                  Zaznacz wszystkich
              </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
              {members.map(member => {
                  const isPresent = selectedEvent.attendees?.includes(member.uid!);
                  return (
                      <div key={member.id} onClick={() => togglePresence(member.uid!)} className={`p-4 flex items-center justify-between cursor-pointer transition select-none ${isPresent ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-gray-50'}`}>
                          <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-transform duration-200 ${isPresent ? 'bg-indigo-600 text-white scale-110' : 'bg-gray-100 text-gray-500'}`}>
                                  {member.firstName[0]}{member.lastName[0]}
                              </div>
                              <div>
                                  <p className={`font-bold transition ${isPresent ? 'text-gray-900' : 'text-gray-600'}`}>{member.firstName} {member.lastName}</p>
                                  <p className="text-xs text-gray-400 uppercase">{member.role}</p>
                              </div>
                          </div>
                          <div className={`transition-all duration-200 ${isPresent ? 'text-indigo-600 scale-110' : 'text-gray-200'}`}>
                              {isPresent ? <CheckCircle2 size={28} fill="currentColor" className="text-indigo-600 bg-white rounded-full" /> : <Circle size={28} />}
                          </div>
                      </div>
                  )
              })}
          </div>

          {/* MODAL Z WIELKIM KODEM QR DO WYDRUKU/POKAZANIA */}
          {showQR && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
                <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center space-y-6" onClick={e => e.stopPropagation()}>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">Zeskanuj, aby potwierdzić</h3>
                        <p className="text-gray-500">{selectedEvent.title}</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 inline-block">
                        {/* Kod zawiera tylko ID wydarzenia */}
                        <QRCode value={selectedEvent.id} size={200} />
                    </div>

                    <p className="text-xs text-gray-400">Pokaż ten ekran tancerzom lub wydrukuj kod.</p>
                    
                    <button onClick={() => setShowQR(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700">
                        Zamknij
                    </button>
                </div>
            </div>
          )}
      </div>
  );
}