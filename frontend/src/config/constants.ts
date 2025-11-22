// Centralne definicje stałych i opcji wyboru
// POPRAWKA: Dodano słowo 'export' przed każdą stałą

export const PAGES = {
    DASHBOARD: 'Pulpit',
    CALENDAR: 'Kalendarz',
    MEMBERS: 'Członkowie',
    COSTUMES: 'Stroje',
    REPERTOIRE: 'Repertuar',
    MEDIA: 'Archiwum Mediów', // Uwaga: Włączone w Repertuar
    QUIZ: 'Quiz Folklorystyczny',
};

export const MEMBER_ROLES = ["Tancerz", "Śpiewak", "Muzyk", "Instruktor", "Choreograf", "Kierownik"];

export const EVENT_TYPES = ["Próba", "Występ", "Spotkanie", "Wyjazd"];

export const ATTENDANCE_STATUSES = {
    PRESENT: 'Obecny',
    ABSENT: 'Nieobecny',
    EXCUSED: 'Usprawiedliwiona',
};

export const REPERTOIRE_TYPES = ["Taniec", "Śpiew", "Obrzęd", "Inne"];

export const QUIZ_CATEGORIES = ["Stroje", "Historia", "Tańce", "Instrumenty", "Regiony"];