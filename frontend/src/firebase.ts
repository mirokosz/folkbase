import { initializeApp } from "firebase/app";
// POPRAWKA: Zaimportuj 'signInWithCustomToken', ponieważ App.tsx go potrzebuje
import { getAuth, signInAnonymously, signInWithCustomToken, type User } from "firebase/auth";
import { getFirestore, collection, doc, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- Twoja konfiguracja Firebase (podana przez Ciebie) ---
const firebaseConfig = {
    apiKey: "AIzaSyDMJiiTs4Tqy8_CFMDE83NLJvUvmXsSIJU",
    authDomain: "folkbase-856a9.firebaseapp.com",
    projectId: "folkbase-856a9",
    storageBucket: "folkbase-856a9.firebasestorage.app",
    messagingSenderId: "253461544685",
    appId: "1:253461544685:web:8263d1dd779aea3ff696e4"
};

// Używamy projectId jako głównego identyfikatora aplikacji
const appId = firebaseConfig.projectId;

// --- Inicjalizacja Firebase ---
let app;
try {
    app = initializeApp(firebaseConfig);
} catch (error) {
    console.error("Błąd inicjalizacji Firebase:", error);
    app = initializeApp({ projectId: "folkbase-856a9" }); 
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Włącz logowanie błędów
setLogLevel('debug');

// --- Tokeny Auth ---
// POPRAWKA: Zdefiniuj 'initialAuthToken' na podstawie obiektu window,
// tak jak 'appId' jest definiowany w App.tsx. 
// Zakładamy, że jest on wstrzykiwany przez środowisko.
export const initialAuthToken = (window as Window & { __initial_auth_token?: string | null }).__initial_auth_token || null;


// --- Funkcje Pomocnicze (Kluczowe dla Architektury) ---
export const getTeamCollectionRef = (teamId: string, collectionName: string) => {
    return collection(db, 'artifacts', appId, 'public/data', 'teams', teamId, collectionName);
};

export const getTeamDocRef = (teamId: string, collectionName: string, docId: string) => {
    return doc(db, 'artifacts', appId, 'public/data', 'teams', teamId, collectionName, docId);
};

// --- Eksport Usług ---
// POPRAWKA: Dodaj 'initialAuthToken' i 'signInWithCustomToken' do eksportu,
// aby App.tsx mógł je zaimportować.
export { db, auth, storage, appId, signInAnonymously, signInWithCustomToken };
export type { User };