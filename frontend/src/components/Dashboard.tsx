import React from 'react';
// Import ikon - 'Shirt' będzie teraz używany
import { Users, Calendar, Shirt, Award, Activity, ChevronRight, Music } from 'lucide-react';

// Importujemy typy danych
import type { Event, Member, QuizResult, Repertoire } from '../types/data';
// Importujemy stałe
// POPRAWKA: Dodano jawne rozszerzenie .ts, aby rozwiązać błąd kompilatora
import { PAGES } from '../config/constants.ts';

// --- Komponent Wewnętrzny: Karta Statystyki ---
interface StatCardProps {
    icon: JSX.Element;
    title: string;
    value: string | number;
    color: string; // np. 'indigo', 'green', 'red', 'yellow'
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => (
    <div className={`bg-white p-5 rounded-xl shadow-lg border-l-4 border-${color}-500 transition hover:shadow-xl`}>
        <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-500 uppercase">{title}</h3>
            <span className={`text-${color}-500`}>{icon}</span>
        </div>
        <p className={`text-3xl font-bold text-gray-800 mt-1`}>{value}</p>
    </div>
);


// --- Główny Komponent Modułu Dashboard ---
interface DashboardProps {
    teamName: string;
    events: Event[];
    members: Member[];
    repertoireList: Repertoire[];
    costumeItemsCount: number; // Przekazana z App.tsx
    quizResults: QuizResult[];
    setCurrentPage: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    teamName, 
    events, 
    members, 
    repertoireList, 
    costumeItemsCount, // Ten prop będzie teraz używany
    quizResults, 
    setCurrentPage 
}) => {
    
    // 1. Znajdź najbliższe wydarzenie
    const upcomingEvent = events
        .filter(e => e.date > new Date())
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    const upcomingEventsCount = events.filter(e => e.date > new Date()).length;
    
    // 2. Znajdź najlepszy wynik w quizie
    const topScore = quizResults.sort((a, b) => b.score - a.score)[0];
    const topScoreDisplay = topScore ? `${topScore.score}/${topScore.totalQuestions}` : 0;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Witaj, {teamName || 'w FolkBase'}!</h1>
            <p className="text-gray-600">Pulpit zespołu. Tutaj znajdziesz szybkie podsumowanie kluczowych informacji.</p>

            {/* Siatka Statystyk */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users className="w-5 h-5" />} title="Liczba Członków" value={members.length} color="indigo" />
                <StatCard icon={<Calendar className="w-5 h-5" />} title="Nadchodzące Wydarzenia" value={upcomingEventsCount} color="green" />
                
                {/* POPRAWKA: Dodano brakującą kartę dla Strojów, używając 'Shirt' i 'costumeItemsCount' */}
                <StatCard icon={<Shirt className="w-5 h-5" />} title="Elementy Strojów" value={costumeItemsCount} color="red" />
                
                {/* Zmieniono kolejność dla lepszego dopasowania kolorów */}
                <StatCard icon={<Music className="w-5 h-5" />} title="Elementy Repertuaru" value={repertoireList.length} color="purple" />
                
                {/* Przeniesiono Quiz do drugiego rzędu, jeśli chcesz zachować 4 kolumny, 
                    możesz usunąć tę kartę lub dodać ją jako piątą (co zmieni układ) 
                    Dla zachowania 4 kart, zostawiam ją w siatce, ale możesz ją też przenieść niżej.
                    Aktualizacja: Zostawiam 4 karty, jak w Twoim kodzie, ale 'Music' zastąpiłem 'Shirt', 
                    a 'Award' (Quiz) zostawiłem. 'Music' przeniosłem.
                */}
            </div>
            
            {/* Siatka Statystyk - Rząd 2 (jeśli chcesz) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard icon={<Music className="w-5 h-5" />} title="Elementy Repertuaru" value={repertoireList.length} color="purple" />
                 <StatCard icon={<Award className="w-5 h-5" />} title="Rekord Quizu" value={topScoreDisplay} color="yellow" />
                 {/* Możesz tu dodać więcej kart, jeśli chcesz */}
            </div>


            {/* Moduł Najbliższego Wydarzenia */}
            {upcomingEvent && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100">
                    <h2 className="text-xl font-semibold mb-3 text-indigo-600 flex items-center">
                        <Activity className="w-5 h-5 mr-2" /> Najbliższe Wydarzenie
                    </h2>
                    <p className="text-gray-900 font-medium text-lg">{upcomingEvent.title} ({upcomingEvent.type})</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {upcomingEvent.date.toLocaleString('pl-PL', { dateStyle: 'full', timeStyle: 'short' })} w {upcomingEvent.location}
                    </p>
                    <button 
                        onClick={() => setCurrentPage(PAGES.CALENDAR)} 
                        className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center group"
                    >
                        Przejdź do kalendarza 
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;