// Definicje typów danych używanych w całej aplikacji

export type UserRole = "admin" | "instructor" | "choreographer" | "member";

export interface MemberProfile {
  id?: string; // ID dokumentu z Firestore
  uid?: string; // Powiązane ID z Auth (opcjonalne, bo członek może być dodany zanim założy konto)
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: "active" | "pending" | "disabled";
  photoUrl?: string;
  phone?: string;
  joinedAt?: any; // Timestamp z Firestore
  birthDate?: string; // Format YYYY-MM-DD
  placeOfBirth?: string;
  pesel?: string;
  idNumber?: string; // Nr dowodu
  address?: string; // Ulica, miasto, kod
  height?: number; // Wzrost w cm
  joinDate?: string; // Data wstąpienia YYYY-MM-DD
  
  // Pola techniczne
  createdAt?: any;
}

export interface RepertoireItem {
  id?: string;
  title: string;
  type: "dance" | "song" | "music"; // Taniec, Pieśń, Kapela
  difficulty: "easy" | "medium" | "hard";
  youtubeLink?: string; // Link do wideo
  driveLink?: string;   // Link do nut/opisu PDF
  description?: string;
  createdAt?: any;
}

export interface EventItem {
  id?: string;
  title: string;
  type: "rehearsal" | "concert" | "workshop" | "meeting"; // Próba, Koncert, Warsztaty, Spotkanie
  startDate: any; // Timestamp z Firestore
  endDate: any;   // Timestamp z Firestore
  location: string;
  description?: string;
  createdBy?: string; // ID instruktora, który dodał
  attendees?: string[];
  program?: ProgramItem[];
}

export interface Costume {
  id?: string;
  name: string; // np. "Krakowski Wschodni"
  type: "set" | "element" | "accessory"; // Komplet, Element (np. buty), Dodatek
  gender: "female" | "male" | "unisex";
  sizeRange: string; // np. "S-XL" albo "36-42"
  quantity: number; // Ile mamy sztuk w magazynie
  imageUrl?: string; // Link do zdjęcia (zewnętrzny)
  description?: string;
}
export interface CostumeAssignment {
  id: string;
  costumeId: string; // ID stroju z magazynu (żeby wiedzieć co oddać)
  costumeName: string; // Kopia nazwy (żeby nie robić miliona zapytań)
  assignedDate: any; // Data wydania
  notes?: string; // Uwagi (np. "Brak jednego guzika")
}

export interface Poll {
  id: string;
  question: string;
  options: string[]; // np. ["Tak", "Nie", "Może"]
  // Mapa głosów: Klucz to UID użytkownika, Wartość to index wybranej opcji (0, 1, 2...)
  votes: { [userId: string]: number }; 
  isActive: boolean;
  createdAt: any;
  createdBy: string;
}

export interface ProgramItem {
  id: string; // Unikalny ID elementu (np. timestamp)
  type: 'repertoire' | 'break' | 'announcement'; // Typ elementu
  title: string; // Nazwa utworu lub "Przerwa"
  duration: number; // Czas w minutach
  description?: string; // Notatka dla konferansjera/akustyka
  costume?: string; // Jaki strój jest potrzebny
  repertoireId?: string; // Link do repertuaru (opcjonalne)
}