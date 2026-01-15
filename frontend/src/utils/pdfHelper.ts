// src/utils/pdfHelper.ts
import { jsPDF } from "jspdf";
import { robotoBase64 } from "./fonts";

export const applyPolishFont = (doc: jsPDF) => {
    const fileName = "Roboto-Regular.ttf";
    
    // Jeśli nie wkleiłeś jeszcze base64, to zabezpieczenie, żeby aplikacja nie padła
    if (robotoBase64.length < 100) {
        console.warn("Brak czcionki Base64! Polskie znaki nie będą działać.");
        return doc;
    }

    doc.addFileToVFS(fileName, robotoBase64);
    doc.addFont(fileName, "Roboto", "normal");
    doc.setFont("Roboto");
    
    return doc;
};