import React, { useState, useEffect } from 'react';
// Importujemy funkcje Firebase do modyfikacji danych
import { addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
// Importujemy funkcje Firebase Storage
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
// Importujemy ikony
import { Music, Plus, Loader2, Edit, Trash2, AlertCircle, Upload, FileText, Video, Volume2, Download } from 'lucide-react';

// Importujemy nasze typy i stałe
import { Repertoire, MediaAsset } from '../types/data';
import { REPERTOIRE_TYPES } from '../config/constants';

// Importujemy konfigurację Firebase i funkcje pomocnicze (w tym 'storage')
import { getTeamCollectionRef, getTeamDocRef, storage } from '../firebase';

// Importujemy nasz wspólny komponent Modal
import Modal from '../components/common/Modal';

// --- Komponent Wewnętrzny: Modal Formularza Repertuaru ---
interface RepertoireFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    currentRepertoire?: Repertoire | null; // Opcjonalny utwór do edycji
}

const RepertoireFormModal: React.FC<RepertoireFormModalProps> = ({ isOpen, onClose, teamId, currentRepertoire = null }) => {
    // Stan formularza
    const [title, setTitle] = useState(currentRepertoire?.title || '');
    const [region, setRegion] = useState(currentRepertoire?.region || '');
    const [type, setType] = useState(currentRepertoire?.type || REPERTOIRE_TYPES[0]);
    const [description, setDescription] = useState(currentRepertoire?.description || '');
    const [loading, setLoading] = useState(false);

    // Efekt do resetowania formularza
    useEffect(() => {
        if (isOpen) {
            setTitle(currentRepertoire?.title || '');
            setRegion(currentRepertoire?.region || '');
            setType(currentRepertoire?.type || REPERTOIRE_TYPES[0]);
            setDescription(currentRepertoire?.description || '');
        }
    }, [isOpen, currentRepertoire]);

    // Obsługa wysłania formularza (Dodawanie lub Edycja)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const repertoireData = { title, region, type, description, teamId, updatedAt: serverTimestamp() };

        try {
            if (currentRepertoire) {
                // Tryb Edycji
                await updateDoc(getTeamDocRef(teamId, 'repertoire', currentRepertoire.id), repertoireData);
            } else {
                // Tryb Dodawania
                await addDoc(getTeamCollectionRef(teamId, 'repertoire'), { ...repertoireData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (error) {
            console.error("Błąd zapisu utworu:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={currentRepertoire ? 'Edytuj Utwór' : 'Dodaj Nowy Utwór'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="repTitle" className="block text-sm font-medium text-gray-700">Tytuł Utworu</label>
                        <input id="repTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="repRegion" className="block text-sm font-medium text-gray-700">Region (np. Krakowski)</label>
                            <input id="repRegion" type="text" value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                        </div>
                        <div>
                            <label htmlFor="repType" className="block text-sm font-medium text-gray-700">Typ Utworu</label>
                            <select id="repType" value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white">
                                {REPERTOIRE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="repDescription" className="block text-sm font-medium text-gray-700">Opis (np. choreografia, uwagi)</label>
                        <textarea id="repDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" disabled={loading}>Anuluj</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center" disabled={loading || !title}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {currentRepertoire ? 'Zapisz Zmiany' : 'Dodaj Utwór'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- Komponent Wewnętrzny: Modal Przesyłania Mediów (Firebase Storage) ---
// 
interface MediaUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    repertoireId: string; // ID utworu, do którego dodajemy media
}

const MediaUploadModal: React.FC<MediaUploadModalProps> = ({ isOpen, onClose, teamId, repertoireId }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Funkcja pomocnicza do określania typu pliku na podstawie rozszerzenia
    const getFileType = (fileName: string): MediaAsset['fileType'] => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['pdf', 'doc', 'docx', 'txt'].includes(ext!)) return 'document';
        if (['mp4', 'mov', 'avi', 'wmv'].includes(ext!)) return 'video';
        if (['mp3', 'wav', 'aac'].includes(ext!)) return 'audio';
        return 'other';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Nie wybrano pliku.");
            return;
        }
        setLoading(true);
        setError(null);
        setUploadProgress(0);

        // Tworzenie unikalnej ścieżki pliku (dla uniknięcia nadpisania)
        // Ścieżka: teams/[teamId]/repertoire/[repertoireId]/[timestamp]_[nazwaPliku]
        const storagePath = `teams/${teamId}/repertoire/${repertoireId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        
        // Używamy uploadBytesResumable, aby móc śledzić postęp
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Rejestrowanie obserwatora postępu
        uploadTask.on('state_changed',
            (snapshot) => {
                // Obliczanie procentu postępu
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                // Obsługa błędu (np. brak uprawnień w Storage Rules)
                console.error("Błąd przesyłania pliku:", error);
                setError("Błąd przesyłania. Sprawdź uprawnienia Storage.");
                setLoading(false);
            },
            async () => {
                // Sukces: Pobierz URL pliku
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                
                // Zapisz informacje o pliku w kolekcji 'mediaAssets' w Firestore
                const mediaData: Omit<MediaAsset, 'id'> = {
                    repertoireId,
                    fileName: file.name,
                    fileType: getFileType(file.name),
                    storagePath, // Zapisujemy ścieżkę, aby móc później usunąć plik
                    downloadUrl,
                    teamId,
                    createdAt: serverTimestamp() as Timestamp, // Używamy Timestamp z serwera
                };
                
                await addDoc(getTeamCollectionRef(teamId, 'mediaAssets'), mediaData);
                
                // Resetuj stan modala i zamknij
                setLoading(false);
                setFile(null);
                setUploadProgress(0);
                onClose();
            }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Dodaj Materiały Multimedialne">
            <div className="space-y-4">
                <div>
                    <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700">Wybierz Plik (Nuty, Wideo, Audio)</label>
                    <input id="fileUpload" type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}

                {/* Pasek Postępu */}
                {loading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                )}
                {loading && <p className="text-sm text-center text-indigo-600">Przesyłanie... {Math.round(uploadProgress)}%</p>}

            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" disabled={loading}>Anuluj</button>
                <button onClick={handleUpload} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center" disabled={loading || !file}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Prześlij Plik
                </button>
            </div>
        </Modal>
    );
};

// --- Główny Komponent Modułu Repertuaru ---
interface RepertoireModuleProps {
    repertoireList: Repertoire[]; // Otrzymuje z App.tsx
    mediaAssets: MediaAsset[];   // Otrzymuje z App.tsx
    teamId: string;              // Otrzymuje z App.tsx
}

const RepertoireModule: React.FC<RepertoireModuleProps> = ({ repertoireList, mediaAssets, teamId }) => {
    // Stan do zarządzania widocznością modali
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    
    // Stan do przekazywania danych do modali
    const [repertoireToEdit, setRepertoireToEdit] = useState<Repertoire | null>(null);
    const [selectedRepertoireId, setSelectedRepertoireId] = useState<string>(''); // Dla modala mediów

    // Otwiera modal formularza utworu (w trybie "Dodaj" lub "Edytuj")
    const openFormModal = (rep: Repertoire | null = null) => {
        setRepertoireToEdit(rep);
        setIsFormModalOpen(true);
    };

    // Otwiera modal dodawania mediów dla konkretnego utworu
    const openMediaModal = (repertoireId: string) => {
        setSelectedRepertoireId(repertoireId);
        setIsMediaModalOpen(true);
    };

    // Obsługa usuwania utworu (Ważne: usuwa też powiązane pliki!)
    const handleDeleteRepertoire = async (rep: Repertoire) => {
        if (!confirm(`Czy na pewno usunąć utwór: ${rep.title}? Spowoduje to również usunięcie wszystkich powiązanych plików multimedialnych!`)) return;

        try {
            // 1. Znajdź i usuń powiązane pliki z Firebase Storage
            const assetsToDelete = mediaAssets.filter(asset => asset.repertoireId === rep.id);
            for (const asset of assetsToDelete) {
                const storageRef = ref(storage, asset.storagePath);
                await deleteObject(storageRef); // Usuń plik ze Storage
                await deleteDoc(getTeamDocRef(teamId, 'mediaAssets', asset.id)); // Usuń wpis z Firestore
            }
            
            // 2. Usuń sam utwór z Firestore
            await deleteDoc(getTeamDocRef(teamId, 'repertoire', rep.id));
        } catch (error) {
            console.error("Błąd usuwania utworu i powiązanych plików:", error);
        }
    };

    // Obsługa usuwania pojedynczego pliku multimedialnego
    const handleDeleteMedia = async (asset: MediaAsset) => {
        if (!confirm(`Czy na pewno usunąć plik: ${asset.fileName}?`)) return;
        try {
            const storageRef = ref(storage, asset.storagePath);
            await deleteObject(storageRef); // Usuń plik ze Storage
            await deleteDoc(getTeamDocRef(teamId, 'mediaAssets', asset.id)); // Usuń wpis z Firestore
        } catch (error) {
            console.error("Błąd usuwania pliku multimedialnego:", error);
        }
    };

    // Funkcja pomocnicza do renderowania ikon plików
    const getMediaIcon = (fileType: MediaAsset['fileType']) => {
        switch (fileType) {
            case 'document': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'video': return <Video className="w-4 h-4 text-red-500" />;
            case 'audio': return <Volume2 className="w-4 h-4 text-green-500" />;
            default: return <FileText className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg h-full">
            {/* Nagłówek Modułu */}
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <Music className="w-7 h-7 mr-3 text-indigo-600" /> Zarządzanie Repertuarem i Multimediami
            </h1>
            <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">Baza utworów, tańców, nut i materiałów szkoleniowych.</p>
                <button onClick={() => openFormModal()} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                    <Plus className="w-5 h-5 mr-2" /> Dodaj Utwór
                </button>
            </div>

            {repertoireList.length === 0 ? (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" /> Brak utworów w repertuarze. Kliknij "Dodaj Utwór", aby rozpocząć!
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Mapowanie listy utworów */}
                    {repertoireList.map(rep => {
                        // Filtrowanie mediów tylko dla tego utworu
                        const relatedMedia = mediaAssets.filter(asset => asset.repertoireId === rep.id);
                        return (
                            <div key={rep.id} className="border border-gray-200 rounded-xl shadow-md overflow-hidden">
                                {/* Nagłówek utworu */}
                                <div className="p-4 bg-gray-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-700">{rep.title}</h3>
                                        <p className="text-sm text-indigo-600">{rep.region} ({rep.type})</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => openMediaModal(rep.id)} className="flex items-center text-sm bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors" title="Dodaj Media">
                                            <Upload className="w-4 h-4 mr-1" /> Dodaj Plik
                                        </button>
                                        <button onClick={() => openFormModal(rep)} className="text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-100" title="Edytuj"><Edit className="w-5 h-5" /></button>
                                        <button onClick={() => handleDeleteRepertoire(rep)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100" title="Usuń"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </div>
                                {/* Opis i lista mediów */}
                                <div className="p-4 bg-white">
                                    <p className="text-sm text-gray-600 mb-3">{rep.description || "Brak opisu."}</p>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Materiały ({relatedMedia.length}):</h4>
                                    {relatedMedia.length > 0 ? (
                                        <div className="flex flex-wrap gap-3">
                                            {relatedMedia.map(asset => (
                                                <div key={asset.id} className="flex items-center bg-gray-50 border rounded-lg p-2 text-sm">
                                                    {getMediaIcon(asset.fileType)}
                                                    <span className="ml-2 mr-4 text-gray-800">{asset.fileName}</span>
                                                    {/* Link do pobrania/otwarcia w nowej karcie */}
                                                    <a href={asset.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700" title="Pobierz/Otwórz">
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                    <button onClick={() => handleDeleteMedia(asset)} className="ml-2 text-red-500 hover:text-red-700" title="Usuń">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Brak przypisanych plików multimedialnych.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modale (są renderowane, ale niewidoczne) */}
            <RepertoireFormModal 
                isOpen={isFormModalOpen} 
                onClose={() => setIsFormModalOpen(false)} 
                teamId={teamId} 
                currentRepertoire={repertoireToEdit} 
            />
            <MediaUploadModal 
                isOpen={isMediaModalOpen} 
                onClose={() => setIsMediaModalOpen(false)} 
                teamId={teamId} 
                repertoireId={selectedRepertoireId} 
            />
        </div>
    );
};

export default RepertoireModule;