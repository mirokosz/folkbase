import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QRScanner() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'scanning' | 'success' | 'error'>('scanning');
    const [message, setMessage] = useState("");

    const handleScan = async (text: string) => {
        if (!text || status !== 'scanning') return;

        // Kod QR zawiera ID wydarzenia
        const eventId = text; 
        
        try {
            // 1. Sprawdź czy wydarzenie istnieje
            const eventRef = doc(db, "teams", "folkbase", "schedule", eventId);
            const eventSnap = await getDoc(eventRef);

            if (!eventSnap.exists()) {
                setStatus('error');
                setMessage("Nie znaleziono wydarzenia. Błędny kod QR.");
                return;
            }

            // 2. Dopisz użytkownika
            await updateDoc(eventRef, {
                attendees: arrayUnion(user?.uid)
            });

            setStatus('success');
            setMessage("Obecność potwierdzona! Miłej próby. 💃");

        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage("Wystąpił błąd podczas zapisu.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col z-50">
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-20">
                <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full">
                    <ArrowLeft />
                </button>
                <h1 className="font-bold">Skaner Obecności</h1>
                <div className="w-10"></div>
            </div>

            {/* Kamera */}
            {status === 'scanning' && (
                <div className="flex-1 flex items-center justify-center relative">
                    <Scanner 
                        // POPRAWKA: Używamy onScan zamiast onResult
                        onScan={(result) => {
                            if (result && result[0]) {
                                handleScan(result[0].rawValue);
                            }
                        }}
                        // POPRAWKA: Typowanie błędu
                        onError={(error: any) => console.log(error?.message || error)}
                        // Opcje skanowania
                        scanDelay={500}
                    />
                    
                    {/* Celownik */}
                    <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-xl relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-l-4 border-t-4 border-indigo-500 -ml-1 -mt-1"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-r-4 border-t-4 border-indigo-500 -mr-1 -mt-1"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-4 border-b-4 border-indigo-500 -ml-1 -mb-1"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-4 border-b-4 border-indigo-500 -mr-1 -mb-1"></div>
                        </div>
                    </div>
                    <p className="absolute bottom-20 text-center w-full text-sm opacity-70">Nakieruj kamerę na kod QR</p>
                </div>
            )}

            {/* Ekran Sukcesu */}
            {status === 'success' && (
                <div className="flex-1 flex flex-col items-center justify-center bg-green-600 p-8 text-center animate-in fade-in zoom-in">
                    <CheckCircle2 size={80} className="mb-4 text-white" />
                    <h2 className="text-3xl font-bold mb-2">Sukces!</h2>
                    <p className="text-white/80 mb-8">{message}</p>
                    <button onClick={() => navigate('/dashboard')} className="bg-white text-green-700 px-8 py-3 rounded-xl font-bold shadow-lg">
                        Wróć do pulpitu
                    </button>
                </div>
            )}

            {/* Ekran Błędu */}
            {status === 'error' && (
                <div className="flex-1 flex flex-col items-center justify-center bg-red-600 p-8 text-center animate-in fade-in zoom-in">
                    <XCircle size={80} className="mb-4 text-white" />
                    <h2 className="text-3xl font-bold mb-2">Błąd</h2>
                    <p className="text-white/80 mb-8">{message}</p>
                    <button onClick={() => setStatus('scanning')} className="bg-white/20 border border-white text-white px-8 py-3 rounded-xl font-bold mb-4">
                        Spróbuj ponownie
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="text-sm opacity-70 hover:underline">
                        Anuluj
                    </button>
                </div>
            )}
        </div>
    );
}