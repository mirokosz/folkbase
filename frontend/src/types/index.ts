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
  phone?: string;
  joinedAt?: any; // Timestamp z Firestore
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