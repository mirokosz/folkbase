import { useEffect, useState } from "react"; // Usunięto 'React'
import { useAuth } from "../context/AuthContext";
import { collection, query, getDocs, orderBy } from "firebase/firestore"; // Usunięto 'where', 'limit', 'Timestamp'
import { db } from "../services/firebase";
import { format, isAfter, isToday, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";
import { toDate } from "../utils/dates"; // Pamiętaj o naszym helperze!
import { Users, Shirt, Music2, Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ members: 0, costumes: 0, repertoire: 0 });
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Pobierz statystyki (liczba dokumentów)
        const membersSnap = await getDocs(collection(db, "teams", "folkbase", "members"));
        const costumesSnap = await getDocs(collection(db, "teams", "folkbase", "costumes"));
        const repertoireSnap = await getDocs(collection(db, "teams", "folkbase", "repertoire"));

        // 2. Pobierz wydarzenia (przyszłe)
        // Pobieramy wszystkie i filtrujemy w JS dla uproszczenia (Firestore ma ograniczenia przy query z datami i sortowaniem na raz bez indeksów)
        const eventsSnap = await getDocs(query(collection(db, "teams", "folkbase", "schedule"), orderBy("startDate", "asc")));
        
        const now = startOfDay(new Date());
        const allEvents = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filtrujemy tylko przyszłe wydarzenia (lub dzisiejsze)
        const futureEvents = allEvents.filter((e: any) => {
            const date = toDate(e.startDate);
            return isAfter(date, now) || isToday(date);
        });

        setStats({
          members: membersSnap.size,
          costumes: costumesSnap.size,
          repertoire: repertoireSnap.size
        });

        if (futureEvents.length > 0) {
          setNextEvent(futureEvents[0]); // Pierwsze to najbliższe
          setUpcomingEvents(futureEvents.slice(1, 4)); // Kolejne 3
        }

      } catch (error) {
        console.error("Błąd pobierania danych do dashboardu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEventGradient = (type: string) => {
    switch(type) {
        case 'concert': return 'from-purple-500 to-indigo-600';
        case 'rehearsal': return 'from-blue-500 to-cyan-500';
        case 'workshop': return 'from-orange-400 to-pink-500';
        default: return 'from-gray-500 to-gray-600';
    }
  };

  const getEventLabel = (type: string) => {
    switch(type) {
        case 'concert': return 'Koncert';
        case 'rehearsal': return 'Próba';
        case 'workshop': return 'Warsztaty';
        case 'meeting': return 'Spotkanie';
        default: return 'Wydarzenie';
    }
  };

  if (loading) return <div className="p-8">Ładowanie pulpitu...</div>;

  return (
    <div className="space-y-8">
      {/* SEKCJA POWITANIA */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Cześć, <span className="text-indigo-600">{profile?.firstName}</span>! 👋
          </h1>
          <p className="text-gray-500 mt-1">Oto co słychać w Twoim zespole.</p>
        </div>
        <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{format(new Date(), "EEEE, d MMMM", { locale: pl })}</p>
        </div>
      </div>

      {/* SEKCJA STATYSTYK (Karty) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div onClick={() => navigate('/members')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition group">
            <div className="p-4 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">Członkowie</p>
                <p className="text-2xl font-bold text-gray-800">{stats.members}</p>
            </div>
        </div>

        <div onClick={() => navigate('/repertoire')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition group">
            <div className="p-4 rounded-xl bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                <Music2 size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">Repertuar</p>
                <p className="text-2xl font-bold text-gray-800">{stats.repertoire}</p>
            </div>
        </div>

        <div onClick={() => navigate('/costumes')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition group">
            <div className="p-4 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Shirt size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">Stroje (Typy)</p>
                <p className="text-2xl font-bold text-gray-800">{stats.costumes}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEWA KOLUMNA: NAJBLIŻSZE WYDARZENIE (Duża Karta) */}
        <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-indigo-600" />
                Najbliższe wydarzenie
            </h2>

            {nextEvent ? (
                <div className={`relative overflow-hidden rounded-3xl p-8 text-white shadow-xl bg-gradient-to-br ${getEventGradient(nextEvent.type)}`}>
                    {/* Tło ozdobne */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-black opacity-10 rounded-full blur-2xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3 border border-white/10">
                                {getEventLabel(nextEvent.type)}
                            </span>
                            <h3 className="text-3xl md:text-4xl font-extrabold mb-2">{nextEvent.title}</h3>
                            <div className="flex flex-col gap-2 mt-4 text-white/90">
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} />
                                    <span className="font-medium text-lg">
                                        {format(toDate(nextEvent.startDate), "d MMMM (EEEE)", { locale: pl })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={18} />
                                    <span className="font-medium">
                                        {format(toDate(nextEvent.startDate), "HH:mm")} - {format(toDate(nextEvent.endDate), "HH:mm")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} />
                                    <span>{nextEvent.location}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[140px] text-center hidden md:block">
                            <p className="text-xs uppercase opacity-70 mb-1">Pozostało</p>
                            <p className="text-3xl font-bold">
                                {Math.ceil((toDate(nextEvent.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                            </p>
                            <p className="text-xs opacity-70">Dni</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Brak nadchodzących wydarzeń.</p>
                    <button onClick={() => navigate('/schedule')} className="text-indigo-600 font-semibold mt-2 hover:underline">
                        Dodaj coś w grafiku
                    </button>
                </div>
            )}
        </div>

        {/* PRAWA KOLUMNA: LISTA KOLEJNYCH */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Kolejne w kolejce</h2>
                <button onClick={() => navigate('/schedule')} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    Pełny grafik <ArrowRight size={14} />
                </button>
            </div>

            <div className="space-y-4">
                {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                    <div key={event.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4 items-center hover:bg-gray-50 transition">
                        <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg w-12 h-12 shrink-0">
                            <span className="text-xs font-bold text-gray-500 uppercase">{format(toDate(event.startDate), "MMM", { locale: pl })}</span>
                            <span className="text-lg font-bold text-gray-800 leading-none">{format(toDate(event.startDate), "d")}</span>
                        </div>
                        <div className="overflow-hidden">
                            <h4 className="font-bold text-gray-800 truncate">{event.title}</h4>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                {format(toDate(event.startDate), "HH:mm")} • {getEventLabel(event.type)}
                            </p>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-gray-400 italic">Brak kolejnych wydarzeń.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}