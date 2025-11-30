import React from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { auth } from "../../services/firebase";
import { useNavigate } from "react-router-dom";

export default function CreateTeam() {
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Brak zalogowanego użytkownika");
      const docRef = await addDoc(collection(db, "teams"), {
        name,
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      // optionally add owner as member:
      await addDoc(collection(db, "members"), {
        teamId: docRef.id,
        userId: user.uid,
        name: user.displayName || "",
        role: "owner",
        createdAt: serverTimestamp()
      });
      navigate(`/dashboard?team=${docRef.id}`);
    } catch (err: any) {
      setError(err.message || "Błąd tworzenia zespołu");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl mb-4">Utwórz zespół</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nazwa zespołu" className="w-full p-2 border rounded" required/>
        {error && <div className="text-red-600">{error}</div>}
        <button className="px-4 py-2 bg-indigo-600 text-white rounded">Utwórz</button>
      </form>
    </div>
  )
}