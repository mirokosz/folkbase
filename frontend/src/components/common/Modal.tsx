import React from 'react';
// Importujemy ikonę 'X' do zamykania
import { X } from 'lucide-react';

// Definiujemy typy dla propsów komponentu
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode; // Zawartość modala
    maxWidth?: string; // Opcjonalna szerokość, np. 'max-w-md', 'max-w-2xl'
}

/**
 * Ogólny, wielokrotnego użytku komponent Modal (okno dialogowe).
 * Zarządza wyświetlaniem i zamykaniem okna.
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) => {
    // Jeśli modal nie jest otwarty, nie renderuj niczego
    if (!isOpen) return null;

    return (
        // Tło (overlay)
        <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300" 
            onClick={onClose} // Zamykanie po kliknięciu na tło
            role="dialog"
            aria-modal="true"
        >
            {/* Kontener Modala */}
            <div 
                className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} p-6 transition-all transform scale-100 opacity-100`} 
                onClick={e => e.stopPropagation()} // Zapobiega zamknięciu po kliknięciu wewnątrz modala
                aria-labelledby="modal-title"
            >
                {/* Nagłówek Modala */}
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 id="modal-title" className="text-xl font-semibold text-gray-800">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
                        aria-label="Zamknij modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Zawartość Modala (przewijalna, jeśli jest za długa) */}
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;