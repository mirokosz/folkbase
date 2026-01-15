import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Konfiguracja
const DIR_TO_SCAN = 'src'; // Skanujemy folder src
const OUTPUT_FILE = 'folkbase_full_context.txt';
const EXTENSIONS = ['.ts', '.tsx', '.css', '.js']; // Rozszerzenia, które nas interesują

// Ustalanie ścieżek
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcPath = path.join(__dirname, DIR_TO_SCAN);
const outputPath = path.join(__dirname, OUTPUT_FILE);

let outputContent = `--- PEŁNY KOD PROJEKTU FOLKBASE ---\nData: ${new Date().toISOString()}\n\n`;

function scanDirectory(directory) {
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath); // Rekurencja dla podfolderów
        } else {
            const ext = path.extname(file);
            if (EXTENSIONS.includes(ext)) {
                // Czytanie pliku
                const content = fs.readFileSync(fullPath, 'utf-8');
                // Dodawanie nagłówka z nazwą pliku (relatywną)
                const relativePath = path.relative(__dirname, fullPath);
                
                outputContent += `\n==================================================\n`;
                outputContent += `FILE: ${relativePath}\n`;
                outputContent += `==================================================\n`;
                outputContent += content + `\n`;
            }
        }
    });
}

try {
    console.log('Rozpoczynam skanowanie folderu src...');
    scanDirectory(srcPath);
    fs.writeFileSync(outputPath, outputContent);
    console.log(`✅ Gotowe! Cały kod został zapisany w pliku: ${OUTPUT_FILE}`);
} catch (err) {
    console.error('❌ Wystąpił błąd:', err);
}