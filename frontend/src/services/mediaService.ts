import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Przesyła zdjęcie stroju do Firebase Storage i zwraca publiczny link (URL).
 * @param file Plik wybrany przez użytkownika
 * @returns Promise z linkiem do zdjęcia
 */
export async function uploadCostumeImage(file: File): Promise<string> {
  // Tworzymy unikalną ścieżkę: costumes/TIMESTAMP_NAZWAPLIKU
  // Dzięki temu pliki o tej samej nazwie się nie nadpiszą
  const path = `teams/folkbase/costumes/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);

  // 1. Wyślij plik
  const snapshot = await uploadBytes(storageRef, file);

  // 2. Pobierz publiczny link
  const url = await getDownloadURL(snapshot.ref);
  
  return url;
}
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const path = `teams/folkbase/avatars/${userId}_${Date.now()}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}