import { Timestamp } from "firebase/firestore";

// Definicja typów dla danych w Firestore
// POPRAWKA: Dodano słowo 'export' przed każdym interfejsem

export interface Member {
    id: string;
    name: string;
    role: string;
    isInstructor: boolean;
    teamId: string;
    email?: string;
    phone?: string;
}

export interface Event {
    id: string;
    title: string;
    type: string;
    location: string;
    date: Date; // Używamy obiektu Date po stronie klienta
    teamId: string;
    description?: string;
}

export interface CostumeType {
    id: string;
    name: string;
    description: string;
    teamId: string;
}

export interface CostumeItem {
    id: string;
    costumeTypeId: string; // Powiązanie z typem stroju
    name: string; // np. "Kamizelka"
    size: string; // np. "M", "38"
    isAvailable: boolean;
    assignedTo: string | null; // memberId
    assignedToName: string | null; // Zduplikowane dla łatwiejszego wyświetlania
    teamId: string;
}

export interface Repertoire {
    id: string;
    title: string;
    region: string; // np. "Krakowskie", "Śląskie"
    type: string; // np. "Taniec", "Śpiew"
    description: string;
    teamId: string;
}

export interface MediaAsset {
    id: string;
    repertoireId: string; // Powiązanie z utworem
    fileName: string;
    fileType: 'document' | 'video' | 'audio' | 'other';
    storagePath: string; // Ścieżka w Firebase Storage
    downloadUrl: string;
    teamId: string;
    createdAt: Timestamp; // Przechowujemy jako Timestamp
}

export interface Question {
    id: string;
    questionText: string;
    options: string[]; // Tablica 4 stringów
    correctOptionIndex: number; // Indeks poprawnej odpowiedzi (0, 1, 2, 3)
    category: string; // np. "Stroje", "Historia", "Tańce"
    teamId: string;
}

export interface QuizResult {
    id: string;
    userId: string;
    userName: string;
    score: number;
    totalQuestions: number;
    timestamp: Date; // Używamy Date po stronie klienta (konwertowane w App.tsx)
    teamId: string;
}