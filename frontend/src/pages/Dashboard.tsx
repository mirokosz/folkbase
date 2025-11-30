import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { format, isAfter, isToday, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";
import { toDate, getUpcomingBirthdays } from "../utils/dates";
import { Users, Shirt, Music2, Calendar, MapPin, Clock, ArrowRight, QrCode, Cake, Gift, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ members: 0, costumes: 0, repertoire: 0 });
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const membersSnap = await getDocs(collection(db, "teams", "folkbase", "members"));
        const costumesSnap = await getDocs(collection(db, "teams", "folkbase", "costumes"));
        const repertoireSnap = await getDocs(collection(db, "teams", "folkbase", "repertoire"));
        const eventsSnap = await getDocs(query(collection(db, "teams", "folkbase", "schedule"), orderBy("startDate", "asc")));
        
        const now = startOfDay(new Date());
        const allEvents = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const futureEvents = allEvents.filter((e: any) => {
            const date = toDate(e.startDate);
            return isAfter(date, now) || isToday(date);
        });

        const membersData = membersSnap.docs.map(doc => doc.data());
        const upcomingBirthdays = getUpcomingBirthdays(membersData);

        setStats({
          members: membersSnap.size,
          costumes: costumesSnap.size,
          repertoire: repertoireSnap.size
        });

        if (futureEvents.length > 0) {
          setNextEvent(futureEvents[0]);
          setUpcomingEvents(futureEvents.slice(1, 4));
        }
        
        setBirthdays(upcomingBirthdays);

      } catch (error) {
        console.error("Błąd pobierania danych:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEventGradient = (type: string) => {
    switch(type) {
        case 'concert': return 'from-violet-600 via-purple-600 to-indigo-600 shadow-purple-900/20';
        case 'rehearsal': return 'from-blue-600 via-indigo-600 to-cyan-600 shadow-blue-900/20';
        case 'workshop': return 'from-orange-500 via-amber-500 to-yellow-500 shadow-orange-900/20';
        default: return 'from-gray-700 to-gray-900 shadow-gray-900/20';
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

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Ładowanie pulpitu...</div>;

  return (
    <div className="space-y-8 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            Cześć, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">{profile?.firstName}</span>! 👋
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-lg">Twój zespół w jednym miejscu.</p>
        </div>
        
        <div className="flex items-center gap-4">
            {profile?.role === 'member' && (
                <button 
                    onClick={() => navigate('/scan')} 
                    className="flex items-center gap-2 bg-gray-900 text-white dark:bg-indigo-600 px-5 py-3 rounded-xl font-bold shadow-lg shadow-gray-300 dark:shadow-none hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95"
                >
                    <QrCode size={20} />
                    <span className="hidden sm:inline">Skanuj Obecność</span>
                </button>
            )}

            <div className="text-right hidden md:block bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Dziś jest</p>
                <p className="text-sm font-bold text-gray-800 dark:text-slate-200 capitalize">
                    {format(new Date(), "EEEE, d MMMM", { locale: pl })}
                </p>
            </div>
        </div>
      </div>

      {/* STATYSTYKI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
            icon={<Users size={28} />} 
            label="Członkowie" 
            value={stats.members} 
            color="text-blue-600 dark:text-blue-400" 
            bg="bg-blue-50 dark:bg-blue-900/20"
            border="border-blue-500 dark:border-blue-500/50"
            onClick={() => navigate('/members')} 
        />
        <StatCard 
            icon={<Music2 size={28} />} 
            label="Repertuar" 
            value={stats.repertoire} 
            color="text-pink-600 dark:text-pink-400" 
            bg="bg-pink-50 dark:bg-pink-900/20"
            border="border-pink-500 dark:border-pink-500/50"
            onClick={() => navigate('/repertoire')} 
        />
        <StatCard 
            icon={<Shirt size={28} />} 
            label="Stroje (Typy)" 
            value={stats.costumes} 
            color="text-purple-600 dark:text-purple-400" 
            bg="bg-purple-50 dark:bg-purple-900/20"
            border="border-purple-500 dark:border-purple-500/50"
            onClick={() => navigate('/costumes')} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEWA KOLUMNA: HERO CARD */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Activity size={24} className="text-indigo-600 dark:text-indigo-400" />
                Najbliższe wydarzenie
            </h2>

            {nextEvent ? (
                <div className={`relative overflow-hidden rounded-[2rem] p-8 md:p-10 text-white shadow-2xl transition-transform hover:scale-[1.01] duration-500 bg-gradient-to-br ${getEventGradient(nextEvent.type)}`}>
                    
                    {/* Abstrakcyjne tło */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white opacity-10 rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-black opacity-20 rounded-full blur-[60px]"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider border border-white/10 shadow-sm">
                                    {getEventLabel(nextEvent.type)}
                                </span>
                                {isToday(toDate(nextEvent.startDate)) && (
                                    <span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold uppercase tracking-wider animate-pulse shadow-sm">
                                        Dzisiaj!
                                    </span>
                                )}
                            </div>
                            
                            <h3 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight drop-shadow-md">
                                {nextEvent.title}
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white/90">
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/5">
                                    <Calendar className="opacity-80" size={20} />
                                    <div>
                                        <p className="text-xs opacity-70 uppercase font-bold">Data</p>
                                        <p className="font-semibold text-lg leading-tight">
                                            {format(toDate(nextEvent.startDate), "d MMMM", { locale: pl })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/5">
                                    <Clock className="opacity-80" size={20} />
                                    <div>
                                        <p className="text-xs opacity-70 uppercase font-bold">Godzina</p>
                                        <p className="font-semibold text-lg leading-tight">
                                            {format(toDate(nextEvent.startDate), "HH:mm")} - {format(toDate(nextEvent.endDate), "HH:mm")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/5 col-span-1 sm:col-span-2">
                                    <MapPin className="opacity-80" size={20} />
                                    <div>
                                        <p className="text-xs opacity-70 uppercase font-bold">Lokalizacja</p>
                                        <p className="font-semibold text-lg leading-tight">{nextEvent.location}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Odliczanie */}
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 min-w-[160px] text-center shadow-lg transform rotate-2 md:rotate-0">
                            <p className="text-xs uppercase font-bold tracking-widest opacity-80 mb-2">Za</p>
                            <p className="text-5xl font-black drop-shadow-sm">
                                {Math.ceil((toDate(nextEvent.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                            </p>
                            <p className="text-sm font-bold uppercase opacity-80 mt-1">Dni</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-[2rem] p-12 text-center text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center h-64">
                    <Calendar size={64} className="mb-4 opacity-10" />
                    <p className="font-medium text-lg">Kalendarz jest pusty.</p>
                    <button onClick={() => navigate('/schedule')} className="text-indigo-600 dark:text-indigo-400 font-bold mt-2 hover:underline">
                        Zaplanuj coś
                    </button>
                </div>
            )}
        </div>

        {/* PRAWA KOLUMNA */}
        <div className="space-y-8">
            
            {/* URODZINY */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_3px_20px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                    <Gift size={20} className="text-pink-500" />
                    Nadchodzące urodziny
                </h2>
                
                {birthdays.length > 0 ? (
                    <div className="space-y-4">
                        {birthdays.map((person) => {
                            const isTodayBirthday = person.daysLeft === 0;
                            return (
                                <div key={person.id} className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 ${isTodayBirthday ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 dark:shadow-none scale-105' : 'bg-gray-50 dark:bg-slate-700 hover:bg-pink-50 dark:hover:bg-slate-600'}`}>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 shadow-sm ${isTodayBirthday ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-600 text-gray-400 dark:text-slate-300'}`}>
                                        {isTodayBirthday ? <Cake size={24} /> : person.firstName[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-bold ${isTodayBirthday ? 'text-white' : 'text-gray-800 dark:text-slate-200'}`}>
                                            {person.firstName} {person.lastName}
                                        </p>
                                        <p className={`text-xs font-medium ${isTodayBirthday ? 'text-white/90' : 'text-gray-400 dark:text-slate-400'}`}>
                                            {isTodayBirthday ? "Świętuje dzisiaj! 🎂" : `${format(person.nextBirthday, "d MMMM", { locale: pl })} (za ${person.daysLeft} dni)`}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm italic">
                        Brak solenizantów w najbliższym czasie.
                    </div>
                )}
            </div>

            {/* KOLEJNE WYDARZENIA */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_3px_20px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Calendar size={20} className="text-indigo-500" />
                        Kolejne w grafiku
                    </h2>
                    <button onClick={() => navigate('/schedule')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                        <ArrowRight size={20} />
                    </button>
                </div>

                <div className="space-y-3 relative">
                    {/* Linia czasu */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-slate-700 rounded-full"></div>

                    {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                        <div key={event.id} className="relative bg-white dark:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex gap-4 items-center hover:shadow-md hover:border-indigo-100 dark:hover:border-slate-600 transition group z-10">
                            <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors rounded-xl w-14 h-14 shrink-0 border border-gray-100 dark:border-slate-600">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 group-hover:text-indigo-400 uppercase">{format(toDate(event.startDate), "MMM", { locale: pl })}</span>
                                <span className="text-xl font-black leading-none dark:text-white">{format(toDate(event.startDate), "d")}</span>
                            </div>
                            <div className="overflow-hidden">
                                <h4 className="font-bold text-gray-800 dark:text-slate-200 truncate">{event.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 font-medium">
                                        {format(toDate(event.startDate), "HH:mm")}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-slate-500 truncate max-w-[100px]">{event.location}</span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-gray-400 dark:text-slate-500 italic text-center py-4">Brak kolejnych wydarzeń.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// Subkomponent Karty Statystyk
function StatCard({ icon, label, value, color, bg, border, onClick }: any) {
    return (
        <div 
            onClick={onClick} 
            className={`
                relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-[1.5rem] 
                border-b-4 ${border} border-t border-r border-l border-gray-100 dark:border-slate-700
                shadow-sm hover:shadow-xl hover:-translate-y-1 
                transition-all duration-300 cursor-pointer group
            `}
        >
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className="text-sm font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-4xl font-black text-gray-800 dark:text-white group-hover:scale-105 transition-transform origin-left">{value}</p>
                </div>
                <div className={`p-4 rounded-2xl ${bg} ${color} group-hover:rotate-12 transition-transform duration-300 shadow-inner`}>
                    {icon}
                </div>
            </div>
            <div className={`absolute -bottom-6 -left-6 w-24 h-24 rounded-full ${bg} opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
        </div>
    )
}