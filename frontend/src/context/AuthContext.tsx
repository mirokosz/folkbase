import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

// POPRAWKA: Dodano pole photoUrl, aby Sidebar nie zgłaszał błędu
interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "instructor" | "member";
  status: "active" | "pending" | "disabled";
  photoUrl?: string; // <--- Tego brakowało!
}

interface AuthContextType {
  user: User | null;         // Obiekt z Firebase Auth
  profile: UserProfile | null; // Obiekt z Firestore (imie, rola, ZDJĘCIE)
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Jeśli użytkownik jest zalogowany, pobierz jego profil z Firestore
        try {
          const docRef = doc(db, "teams", "folkbase", "members", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            console.error("Brak profilu w bazie dla tego użytkownika!");
            setProfile(null);
          }
        } catch (error) {
          console.error("Błąd pobierania profilu:", error);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}