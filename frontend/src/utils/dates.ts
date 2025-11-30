import { Timestamp } from "firebase/firestore";
import { setYear, startOfDay, isBefore, differenceInDays, addYears } from "date-fns";

export const toDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Timestamp) return date.toDate();
  if (date instanceof Date) return date;
  return new Date(date);
};

export const getUpcomingBirthdays = (members: any[]) => {
    const today = startOfDay(new Date());
    const currentYear = today.getFullYear();

    const upcoming = members
        .filter(m => m.birthDate) // Bierzemy tylko tych, co podali datę
        .map(m => {
            const birthDate = new Date(m.birthDate);
            // Ustawiamy urodziny w TYM roku
            let nextBirthday = setYear(birthDate, currentYear);
            
            // Jeśli urodziny w tym roku już były (np. wczoraj), to następne są za rok
            if (isBefore(nextBirthday, today)) {
                nextBirthday = addYears(nextBirthday, 1);
            }
            
            const daysLeft = differenceInDays(nextBirthday, today);
            
            // Obliczamy wiek (opcjonalne, ale fajne)
            const age = nextBirthday.getFullYear() - birthDate.getFullYear();

            return { ...m, nextBirthday, daysLeft, age };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft) // Sortujemy od najbliższych
        .slice(0, 3); // Bierzemy tylko 3 najbliższe osoby

    return upcoming;
};

