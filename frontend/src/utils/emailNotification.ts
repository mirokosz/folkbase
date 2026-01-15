import emailjs from '@emailjs/browser';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";

// --- WKLEJ NOWY SERVICE ID PO ODŚWIEŻENIU ---
const SERVICE_ID = "service_wck2gy2"; // <-- TU NOWY ID
const TEMPLATE_ID = "template_mj1ixjc"; // Ten ze screena jest OK
const PUBLIC_KEY = "P30KaIqspTTjo9spj"; // Ten ze screena jest OK
// -------------------------------------------

interface NotificationData {
    type: string;
    title: string;
    message: string;
}

export const sendNotificationToAll = async (data: NotificationData) => {
    try {
        console.log("🚀 Przygotowanie wysyłki...");

        // 1. Pobierz e-maile
        const q = query(collection(db, "teams", "folkbase", "members"), where("status", "==", "active"));
        const snapshot = await getDocs(q);
        const emails = snapshot.docs.map(doc => doc.data().email).filter(e => e && e.includes("@"));

        if (emails.length === 0) {
            console.warn("Brak odbiorców.");
            return;
        }

        // 2. Wysyłka testowa na Twój adres
        const templateParams = {
            to_email: "michalrokosz663166610@gmail.com", // Twój adres
            
            // Dopasowanie do zmiennych w Twoim szablonie ze zdjęcia:
            name: "Administrator FolkBase", // W szablonie masz {{name}}
            email: "no-reply@folkbase.app", // W szablonie masz {{email}} w polu Reply-To
            
            type: data.type,
            title: data.title,
            message: data.message
        };

        const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log("✅ Email wysłany!", res.status, res.text);
        alert("Powiadomienie wysłane pomyślnie!");

    } catch (error: any) {
        console.error("❌ Błąd EmailJS:", error);
        alert("Błąd wysyłania: " + JSON.stringify(error));
    }
};