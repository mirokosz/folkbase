// POPRAWKA: Zaimportuj 'useCallback' do naprawienia ostrzeżenia o zależności useEffect
import React, { useState, useEffect, useCallback } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
// POPRAWKA: Zaimportuj 'addDoc' i 'getDocs' - są wymagane w kodzie
import { doc, onSnapshot, collection, query, setDoc, serverTimestamp, Timestamp, addDoc, getDocs } from 'firebase/firestore';
import { Activity, Users, Calendar, Shirt, Music, LogOut, Loader2, Menu, HelpCircle } from 'lucide-react';

// --- Importy Konfiguracji i Logiki ---
// Importy z firebase.ts są teraz poprawne
import { db, auth, initialAuthToken, signInAnonymously, signInWithCustomToken, type User } from './firebase';
import { PAGES } from './config/constants';
import type { Member, Event, CostumeType, CostumeItem, Repertoire, MediaAsset, Question, QuizResult } from './types/data';

// --- Importy Modułów ---
import Dashboard from './components/Dashboard';
import MembersModule from './modules/MembersModule';
import CalendarModule from './modules/CalendarModule';
import CostumesModule from './modules/CostumesModule';
import RepertoireModule from './modules/RepertoireModule';
import QuizModule from './modules/QuizModule';

// --- Globalne ID (dla uproszczenia) ---
const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'folkbase-856a9';
const defaultTeamId = 'zespol-folklorystyczny-test'; // Stała ID dla uproszczenia

// Komponent Ładowania
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Ładowanie..." }) => (
    <div className="flex h-screen items-center justify-center bg-gray-50 text-indigo-600">
        <Loader2 className="w-10 h-10 animate-spin mr-3" />
        <span className="text-lg font-medium">{message}</span>
    </div>
);

// Komponent Przycisku Nawigacji
const NavItem: React.FC<{ page: string; icon: JSX.Element; currentPage: string; onClick: () => void }> = ({ page, icon, currentPage, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center p-3 text-sm font-medium rounded-lg transition-colors duration-200 w-full text-left
            ${currentPage === page
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
    >
        {React.cloneElement(icon, { className: "w-5 h-5" })}
        <span className="ml-3">{page}</span>
    </button>
);

// --- Główny Komponent Aplikacji ---
const App: React.FC = () => {
    // --- Stan Uwierzytelnienia i Nawigacji ---
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(PAGES.DASHBOARD);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- Stan Danych (z Firestore) ---
    const [teamName, setTeamName] = useState("Mój Zespół");
    const [members, setMembers] = useState<Member[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [costumeTypes, setCostumeTypes] = useState<CostumeType[]>([]);
    const [costumeItems, setCostumeItems] = useState<CostumeItem[]>([]);
    const [repertoireList, setRepertoireList] = useState<Repertoire[]>([]);
    const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

    // Sprawdzenie, czy użytkownik jest instruktorem
    const isInstructor = !!(user && members.find(m => m.id === user.uid && m.isInstructor));

    // --- Efekt 1: Uwierzytelnianie ---
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Ta logika jest teraz poprawna, ponieważ firebase.ts eksportuje obie funkcje
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Błąd autoryzacji Firebase:", error);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
            if (currentUser) {
                setUser(currentUser);
            } else if (!loading) { 
                await initializeAuth();
            }
            setLoading(false); 
        });

        if (!user) {
            initializeAuth();
        }

        return () => unsubscribe();
    }, [loading, user]);

    // POPRAWKA: Owiń 'addInitialData' w 'useCallback', aby bezpiecznie dodać ją
    // do tablicy zależności 'useEffect' poniżej. Rozwiązuje to ostrzeżenie ESLint.
    const addInitialData = useCallback(async (teamPath: string) => {
        try {
            if (!user) return;
            
            // POPRAWKA: Użyj 'getDocs(collection(...))' (składnia v9+) zamiast 'collection(...).get()' (składnia v8)
            const membersSnap = await getDocs(collection(db, teamPath, 'members'));
            if (!membersSnap.empty) {
                console.log("Dane startowe już istnieją.");
                return; 
            }

            // Dodaj użytkownika jako instruktora
            await setDoc(doc(db, teamPath, 'members', user.uid), { 
                name: "Administrator", 
                role: "Instruktor", 
                isInstructor: true, 
                teamId: defaultTeamId, 
                createdAt: serverTimestamp() 
            });
            
            // Dodaj przykładowe wydarzenie
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            // POPRAWKA: Używasz 'addDoc', więc upewnij się, że jest zaimportowany (zrobione w linii 4)
            await addDoc(collection(db, teamPath, 'events'), { 
                title: "Próba Poloneza", 
                type: "Próba", 
                date: nextWeek, 
                location: "Sala A", 
                teamId: defaultTeamId, 
                createdAt: serverTimestamp() 
            });

        } catch (e) {
            console.error("Błąd dodawania danych startowych:", e);
        }
    }, [user]); // POPRAWKA: 'user' jest zależnością tej funkcji

    // --- Efekt 2: Subskrypcje Danych (Główna Logika) ---
    useEffect(() => {
        if (!user || !defaultTeamId) return;

        const teamPath = `artifacts/${appId}/public/data/teams/${defaultTeamId}`;

        const createSubscription = (
            collectionName: string, 
            setter: React.Dispatch<React.SetStateAction<any[]>>, 
            dataTransform: (data: any) => any = (data) => data 
        ) => {
            const q = query(collection(db, teamPath, collectionName));
            return onSnapshot(q, (snapshot) => {
                setter(snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...dataTransform(doc.data()),
                })));
            }, (error) => {
                console.error(`Błąd pobierania (${collectionName}):`, error.message);
            });
        };

        const unsubscribeTeam = onSnapshot(doc(db, teamPath), (docSnap) => {
            if (docSnap.exists()) {
                setTeamName(docSnap.data().name || "Mój Zespół");
            } else {
                setDoc(doc(db, teamPath), { name: "Mój Zespół Folklorystyczny", adminId: user.uid, created: serverTimestamp() })
                    .then(() => addInitialData(teamPath)) // Ta funkcja jest teraz stabilna
                    .catch(e => console.error("Błąd tworzenia zespołu:", e));
            }
        }, (error) => {
            console.error("Błąd pobierania danych zespołu:", error);
        });

        // Konwertowanie Timestamp na Date
        const toDate = (data: any, field: string) => ({
            ...data,
            [field]: (data[field] as Timestamp)?.toDate() || new Date()
        });

        const subscriptions = [
            createSubscription('members', setMembers),
            createSubscription('events', setEvents, (data) => toDate(data, 'date')),
            createSubscription('costumes', setCostumeTypes),
            createSubscription('costumeItems', setCostumeItems),
            createSubscription('repertoire', setRepertoireList),
            createSubscription('mediaAssets', setMediaAssets, (data) => toDate(data, 'createdAt')),
            createSubscription('quizQuestions', setQuestions),
            createSubscription('quizResults', setQuizResults, (data) => toDate(data, 'timestamp')),
        ];

        return () => {
            unsubscribeTeam();
            subscriptions.forEach(unsubscribe => unsubscribe());
        };

    // POPRAWKA: Dodaj 'addInitialData' do tablicy zależności, aby usunąć ostrzeżenie ESLint
    }, [user, addInitialData]); 

    // --- Renderowanie Modułów (Routing) ---
    const renderPage = () => {
        if (!user || !defaultTeamId) {
            return <LoadingSpinner message="Łączenie z serwerem..." />;
        }

        switch (currentPage) {
            case PAGES.DASHBOARD:
                return <Dashboard 
                    teamName={teamName} 
                    events={events} 
                    members={members} 
                    repertoireList={repertoireList}
                    costumeItemsCount={costumeItems.length}
                    quizResults={quizResults}
                    setCurrentPage={setCurrentPage} 
                />;
            case PAGES.CALENDAR:
                return <CalendarModule events={events} members={members} teamId={defaultTeamId} />;
            case PAGES.MEMBERS:
                return <MembersModule members={members} teamId={defaultTeamId} />;
            case PAGES.COSTUMES:
                return <CostumesModule costumeTypes={costumeTypes} costumeItems={costumeItems} members={members} teamId={defaultTeamId} />;
            case PAGES.REPERTOIRE:
            case PAGES.MEDIA: 
                return <RepertoireModule repertoireList={repertoireList} mediaAssets={mediaAssets} teamId={defaultTeamId} />;
            case PAGES.QUIZ:
                return <QuizModule 
                    isInstructor={isInstructor}
                    questions={questions}
                    quizResults={quizResults}
                    members={members}
                    currentUserId={user.uid}
                    teamId={defaultTeamId}
                />;
            default:
                return <Dashboard 
                    teamName={teamName} 
                    events={events} 
                    members={members} 
                    repertoireList={repertoireList}
                    costumeItemsCount={costumeItems.length}
                    quizResults={quizResults}
                    setCurrentPage={setCurrentPage} 
                />;
        }
    };

    if (loading) {
        return <LoadingSpinner message="Inicjalizacja aplikacji..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Sidebar (Nawigacja) */}
            <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-white shadow-xl flex flex-col`}>
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-extrabold text-indigo-700">FolkBase</h2>
                    <p className="text-xs text-gray-500 mt-1">Praca Inżynierska</p>
                </div>
                <nav className="flex-grow p-4 space-y-1">
                    <NavItem page={PAGES.DASHBOARD} icon={<Activity />} currentPage={currentPage} onClick={() => { setCurrentPage(PAGES.DASHBOARD); setIsSidebarOpen(false); }} />
                    <NavItem page={PAGES.CALENDAR} icon={<Calendar />} currentPage={currentPage} onClick={() => { setCurrentPage(PAGES.CALENDAR); setIsSidebarOpen(false); }} />
                    <NavItem page={PAGES.MEMBERS} icon={<Users />} currentPage={currentPage} onClick={() => { setCurrentPage(PAGES.MEMBERS); setIsSidebarOpen(false); }} />
                    <NavItem page={PAGES.COSTUMES} icon={<Shirt />} currentPage={currentPage} onClick={() => { setCurrentPage(PAGES.COSTUMES); setIsSidebarOpen(false); }} />
                    <NavItem page={PAGES.REPERTOIRE} icon={<Music />} currentPage={currentPage} onClick={() => { setCurrentPage(PAGES.REPERTOIRE); setIsSidebarOpen(false); }} />
                    <NavItem page={PAGES.QUIZ} icon={<HelpCircle />} currentPage={currentPage} onClick={() => { setCurrentPage(PAGES.QUIZ); setIsSidebarOpen(false); }} />
                </nav>
                <div className="p-4 border-t">
                    <p className="text-xs text-gray-600 mb-2">Zalogowano jako: <br/> <span className="font-mono text-xs">{user?.uid.substring(0, 15)}...</span></p>
                    <button
                        onClick={() => signOut(auth)}
                        className="flex items-center p-3 text-sm font-medium rounded-lg transition-colors duration-200 w-full text-left text-red-600 hover:bg-red-50"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="ml-3">Wyloguj</span>
                    </button>
                    <p className="mt-2 text-xs text-gray-400 text-center">
                        App ID: {appId}
                    </p>
                </div>
            </aside>

            {/* Content (Główna Treść) */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                {/* Header (Nagłówek na Mobile) */}
                <header className="bg-white p-4 rounded-xl shadow-md mb-6 md:hidden flex justify-between items-center sticky top-0 z-20">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-indigo-600 p-2 rounded-lg hover:bg-indigo-50">
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">{currentPage}</h1>
                    <div className="w-6 h-6"></div> {/* Placeholder */}
                </header>

                {/* Overlay do zamknięcia Sidebara na Mobile */}
                {isSidebarOpen && (
                    <div className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
                )}

                {/* Główna Zawartość Modułu */}
                <div className="h-full">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

export default App;