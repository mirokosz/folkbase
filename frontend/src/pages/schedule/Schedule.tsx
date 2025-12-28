import React, { useEffect, useState } from "react";
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay 
} from "date-fns";
import { pl } from "date-fns/locale";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, Timestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { EventItem } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { toDate } from "../../utils/dates";
import { ChevronLeft, ChevronRight, Plus, MapPin, X, Trash2, Calendar } from "lucide-react";
import { sendNotificationToAll } from "../../utils/emailNotification";

export default function Schedule() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForNew, setSelectedDateForNew] = useState<Date | null>(null);

  const canManage = profile?.role === 'admin' || profile?.role === 'instructor';

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const today = startOfDay(new Date());

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

  useEffect(() => {
    const q = query(collection(db, "teams", "folkbase", "schedule"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventItem));
      items.sort((a, b) => toDate(a.startDate).getTime() - toDate(b.startDate).getTime());
      setEvents(items);
    });
    return () => unsub();
  }, []);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    if (canManage) {
        setSelectedDateForNew(day);
        setSelectedEvent(null);
        setIsModalOpen(true);
    }
  };

  const handleEventClick = (e: React.MouseEvent, event: EventItem) => {
      e.stopPropagation();
      setSelectedEvent(event);
      setIsModalOpen(true);
  };

  const getEventStyle = (type: string) => {
      const base = "border-l-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 truncate";
      switch(type) {
          case 'rehearsal': return `${base} bg-gradient-to-r from-blue-50 to-white dark:from-blue-900 dark:to-slate-800 border-blue-500 text-blue-800 dark:text-blue-100`;
          case 'concert': return `${base} bg-gradient-to-r from-purple-50 to-white dark:from-purple-900 dark:to-slate-800 border-purple-500 text-purple-800 dark:text-purple-100`;
          case 'workshop': return `${base} bg-gradient-to-r from-orange-50 to-white dark:from-orange-900 dark:to-slate-800 border-orange-500 text-orange-800 dark:text-orange-100`;
          default: return `${base} bg-gradient-to-r from-gray-50 to-white dark:from-slate-700 dark:to-slate-800 border-gray-400 text-gray-700 dark:text-gray-200`;
      }
  };

  const MAX_VISIBLE_EVENTS = 3;

  return (
    <div className="space-y-6 h-full flex flex-col font-sans">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white capitalize flex items-baseline gap-3">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                    {format(currentDate, "LLLL", { locale: pl })}
                </span>
                <span className="text-xl text-gray-400 dark:text-slate-500 font-medium">{format(currentDate, "yyyy")}</span>
            </h1>
        </div>
        
        <div className="flex items-center bg-gray-100/80 dark:bg-slate-700 rounded-xl p-1.5 border border-gray-200 dark:border-slate-600 shadow-inner">
            <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm rounded-lg transition text-gray-600 dark:text-slate-300"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="text-sm font-bold px-4 text-gray-600 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Dzisiaj</button>
            <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm rounded-lg transition text-gray-600 dark:text-slate-300"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* --- WIDOK DESKTOPOWY (SIATKA) --- */}
      <div className="hidden md:flex bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-slate-700 overflow-hidden flex-col flex-1 transition-colors">
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/50 backdrop-blur sticky top-0 z-10">
            {weekDays.map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    {day}
                </div>
            ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr bg-gray-100 dark:bg-slate-700 gap-px flex-1 min-h-[600px]"> 
            {calendarDays.map((day) => {
                const allDayEvents = events.filter(e => isSameDay(toDate(e.startDate), day));
                const visibleEvents = allDayEvents.slice(0, MAX_VISIBLE_EVENTS);
                const hiddenEventsCount = allDayEvents.length - MAX_VISIBLE_EVENTS;

                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);
                const isPast = isBefore(day, today);
                
                let cellBackground = "bg-white dark:bg-slate-800";
                if (!isCurrentMonth) cellBackground = "bg-gray-50/50 dark:bg-slate-900/50";
                else if (isPast) cellBackground = "bg-gray-50 dark:bg-slate-800/80";

                const todayContainerStyle = isDayToday ? "ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-slate-800 z-10 shadow-lg" : "";

                return (
                    <div 
                        key={day.toString()} 
                        onClick={() => handleDayClick(day)}
                        className={`
                            relative p-2 transition-all duration-200 group overflow-hidden flex flex-col
                            ${cellBackground} ${todayContainerStyle}
                            ${(canManage && isCurrentMonth) ? 'hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 cursor-pointer' : ''}
                        `}
                    >
                        <div className="flex justify-between items-start mb-2 shrink-0">
                            <span className={`
                                text-lg font-bold w-9 h-9 flex items-center justify-center rounded-full transition-colors
                                ${isDayToday ? 'bg-indigo-600 text-white shadow-md' : 
                                  isCurrentMonth ? (isPast ? 'text-gray-400 dark:text-slate-600' : 'text-gray-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400') : 'text-gray-300 dark:text-slate-600'}
                            `}>
                                {format(day, "d")}
                            </span>

                            {canManage && isCurrentMonth && !isPast && (
                                <button className="opacity-0 group-hover:opacity-100 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-full transition-all p-1.5 shadow-sm scale-90 hover:scale-105">
                                    <Plus size={16} />
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-1.5 flex-1">
                            {visibleEvents.map(event => (
                                <div 
                                    key={event.id}
                                    onClick={(e) => handleEventClick(e, event)}
                                    className={`
                                        text-xs px-2.5 py-1.5 rounded-lg cursor-pointer
                                        flex items-center gap-2 font-semibold
                                        ${getEventStyle(event.type)}
                                    `}
                                >
                                    <span className="truncate flex-1">{event.title}</span>
                                </div>
                            ))}
                            
                            {hiddenEventsCount > 0 && (
                                <div className="text-xs text-gray-500 dark:text-slate-400 font-medium text-center bg-gray-100/80 dark:bg-slate-700 rounded-md py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                                    +{hiddenEventsCount} więcej...
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* --- WIDOK MOBILNY (AGENDA) --- */}
      <div className="md:hidden space-y-4">
         {/* Przycisk dodawania na mobile */}
         {canManage && (
             <button 
                onClick={() => { setSelectedDateForNew(new Date()); setSelectedEvent(null); setIsModalOpen(true); }}
                className="w-full py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold flex items-center justify-center gap-2"
             >
                 <Plus size={20} /> Dodaj wydarzenie
             </button>
         )}

         {calendarDays.map(day => {
             const dayEvents = events.filter(e => isSameDay(toDate(e.startDate), day));
             if(dayEvents.length === 0) return null; // Ukrywamy dni bez wydarzeń
             
             const isDayToday = isToday(day);

             return (
                 <div key={day.toISOString()} className="space-y-2">
                     <div className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDayToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400'}`}>
                        {isDayToday && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                        {format(day, "d MMMM (EEEE)", { locale: pl })}
                     </div>
                     
                     <div className="space-y-2">
                         {dayEvents.map(event => (
                             <div 
                                key={event.id}
                                onClick={(e) => handleEventClick(e, event)}
                                className={`
                                    p-4 rounded-xl cursor-pointer bg-white dark:bg-slate-800 border-l-4 shadow-sm
                                    ${getEventStyle(event.type).replace('truncate', '')} // Usuwamy truncate żeby na mobile zawijało tekst
                                `}
                             >
                                 <div className="flex justify-between items-start">
                                     <div>
                                        <div className="font-bold text-base mb-1">{event.title}</div>
                                        <div className="text-xs opacity-80 flex items-center gap-1.5">
                                            <span>{format(toDate(event.startDate), "HH:mm")} - {format(toDate(event.endDate), "HH:mm")}</span>
                                            {event.location && <span>• {event.location}</span>}
                                        </div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )
         })}
         
         {/* Jeśli w całym miesiącu nie ma wydarzeń */}
         {calendarDays.every(day => events.filter(e => isSameDay(toDate(e.startDate), day)).length === 0) && (
             <div className="text-center py-10 text-gray-400 dark:text-slate-500 flex flex-col items-center gap-2">
                 <Calendar size={48} className="opacity-20" />
                 <span>Brak wydarzeń w tym miesiącu.</span>
             </div>
         )}
      </div>

      {isModalOpen && (
          <EventModal 
            onClose={() => setIsModalOpen(false)} 
            eventToEdit={selectedEvent}
            initialDate={selectedDateForNew}
            canManage={canManage}
          />
      )}
    </div>
  );
}

function EventModal({ onClose, eventToEdit, initialDate, canManage }: any) {
    const defaultStart = initialDate ? new Date(initialDate.setHours(18, 0, 0, 0)) : new Date();
    const defaultEnd = initialDate ? new Date(initialDate.setHours(20, 0, 0, 0)) : new Date();

    const formatDateForInput = (date: any) => {
        if (!date) return "";
        return format(toDate(date), "yyyy-MM-dd'T'HH:mm");
    };

    const [formData, setFormData] = useState({
        title: "",
        type: "rehearsal",
        location: "Sala prób",
        description: "",
        startDate: formatDateForInput(defaultStart),
        endDate: formatDateForInput(defaultEnd),
    });
    const [sendEmail, setSendEmail] = useState(false);

    useEffect(() => {
        if (eventToEdit) {
            setFormData({
                title: eventToEdit.title,
                type: eventToEdit.type,
                location: eventToEdit.location,
                description: eventToEdit.description || "",
                startDate: formatDateForInput(eventToEdit.startDate),
                endDate: formatDateForInput(eventToEdit.endDate),
            });
        }
    }, [eventToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                startDate: Timestamp.fromDate(new Date(formData.startDate)),
                endDate: Timestamp.fromDate(new Date(formData.endDate)),
            };

            if (eventToEdit?.id) {
                await updateDoc(doc(db, "teams", "folkbase", "schedule", eventToEdit.id), payload);
            } else {
                await addDoc(collection(db, "teams", "folkbase", "schedule"), payload);
                
                if (sendEmail) {
                    await sendNotificationToAll({
                        type: "Nowe Wydarzenie",
                        title: formData.title,
                        message: `Kiedy: ${format(new Date(formData.startDate), "dd.MM.yyyy HH:mm")}, Gdzie: ${formData.location}`
                    });
                    alert("Zapisano i wysłano powiadomienia!");
                }
            }
            onClose();
        } catch (error) {
            console.error(error);
            alert("Błąd zapisu");
        }
    };

    const handleDelete = async () => {
        if(!window.confirm("Usunąć to wydarzenie?")) return;
        try {
            await deleteDoc(doc(db, "teams", "folkbase", "schedule", eventToEdit.id));
            onClose();
        } catch(e) { console.error(e); alert("Błąd usuwania"); }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-gray-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur">
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                        {eventToEdit ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Tytuł</label>
                        <input required className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none" 
                            placeholder="Np. Próba generalna"
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
                            disabled={!canManage}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Typ</label>
                            <select className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                                value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                                disabled={!canManage}
                            >
                                <option value="rehearsal">🟦 Próba</option>
                                <option value="concert">🟪 Koncert</option>
                                <option value="workshop">🟧 Warsztaty</option>
                                <option value="meeting">⬜ Spotkanie</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Lokalizacja</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute top-3 left-3 text-gray-400" />
                                <input className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                                    disabled={!canManage}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Start</label>
                            <input type="datetime-local" required className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5 text-sm outline-none" 
                                value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                                disabled={!canManage}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Koniec</label>
                            <input type="datetime-local" required className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5 text-sm outline-none" 
                                value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                                disabled={!canManage}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Opis</label>
                        <textarea className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5 h-24 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                            placeholder="Dodatkowe informacje..."
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                            disabled={!canManage}
                        />
                    </div>

                    {canManage && !eventToEdit && (
                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="sendEmailSchedule" 
                                checked={sendEmail} 
                                onChange={e => setSendEmail(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            <label htmlFor="sendEmailSchedule" className="text-sm text-gray-600 dark:text-slate-300">Wyślij powiadomienie e-mail</label>
                        </div>
                    )}

                    {canManage ? (
                        <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-slate-700 mt-2">
                            {eventToEdit ? (
                                <button type="button" onClick={handleDelete} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition">
                                    <Trash2 size={18} /> Usuń
                                </button>
                            ) : <div></div>}
                            
                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium transition">Anuluj</button>
                                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none font-medium transition">
                                    {eventToEdit ? "Zapisz zmiany" : "Dodaj wydarzenie"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-sm text-gray-400 pt-2 italic">
                            Brak uprawnień do edycji tego wydarzenia.
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}