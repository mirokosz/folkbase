import React, { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { uploadCostumeImage } from "../../services/mediaService"; 
import { useAuth } from "../../context/AuthContext";
import { Plus, Trash2, FolderPlus, Folder, ArrowLeft, X, Loader2 } from "lucide-react";
// POPRAWKA: Importujemy toast zamiast używać alert()
import toast from "react-hot-toast";

// Typy danych
interface Album {
    id: string;
    title: string;
    createdAt: any;
    createdBy: string;
}

interface Photo {
    id: string;
    url: string;
    createdAt: any;
}

export default function Gallery() {
    const { profile, user } = useAuth();
    const canManage = profile?.role === 'admin' || profile?.role === 'instructor';
    
    const [view, setView] = useState<'list' | 'album'>('list');
    const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
    
    if (view === 'list') {
        return <AlbumsList canManage={canManage} onSelectAlbum={(album) => {
            setCurrentAlbum(album);
            setView('album');
        }} userUid={user?.uid} />;
    }

    return (
        <AlbumPhotos 
            album={currentAlbum!} 
            canManage={canManage} 
            onBack={() => {
                setCurrentAlbum(null);
                setView('list');
            }} 
            userUid={user?.uid}
        />
    );
}

// --- KOMPONENT 1: LISTA ALBUMÓW ---
function AlbumsList({ canManage, onSelectAlbum, userUid }: { canManage: boolean, onSelectAlbum: (a: Album) => void, userUid?: string }) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "teams", "folkbase", "albums"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setAlbums(snap.docs.map(d => ({ id: d.id, ...d.data() } as Album)));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleCreateAlbum = async () => {
        const title = prompt("Podaj nazwę nowego folderu (np. Obóz 2023):");
        if (!title || !userUid) return;

        // TOAST: Loading (opcjonalne, ale ładne)
        const toastId = toast.loading("Tworzenie folderu...");

        try {
            await addDoc(collection(db, "teams", "folkbase", "albums"), {
                title,
                createdAt: serverTimestamp(),
                createdBy: userUid
            });
            // TOAST: Sukces
            toast.success("Folder utworzony!", { id: toastId });
        } catch (error) { 
            console.error(error); 
            // TOAST: Błąd
            toast.error("Nie udało się utworzyć folderu.", { id: toastId });
        }
    };

    const handleDeleteAlbum = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Usunąć ten folder? Zdjęcia w środku też znikną z widoku.")) return;
        
        try {
            await deleteDoc(doc(db, "teams", "folkbase", "albums", id));
            toast.success("Folder usunięty.");
        } catch (error) { 
            console.error(error);
            toast.error("Błąd podczas usuwania."); 
        }
    };

    if (loading) return <div className="p-8 text-gray-500">Ładowanie folderów...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Galeria Zespołu</h1>
                    <p className="text-gray-500 dark:text-slate-400">Wybierz folder, aby zobaczyć zdjęcia.</p>
                </div>
                {canManage && (
                    <button onClick={handleCreateAlbum} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        <FolderPlus size={20} /> Utwórz Folder
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {albums.map(album => (
                    <div 
                        key={album.id} 
                        onClick={() => onSelectAlbum(album)}
                        className="group bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 rounded-xl cursor-pointer hover:shadow-lg hover:border-indigo-500 transition flex flex-col items-center justify-center gap-4 relative"
                    >
                        <Folder size={64} className="text-indigo-200 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                        <h3 className="font-bold text-gray-800 dark:text-white text-center">{album.title}</h3>
                        
                        {canManage && (
                            <button 
                                onClick={(e) => handleDeleteAlbum(album.id, e)}
                                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                title="Usuń folder"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            
            {albums.length === 0 && (
                <div className="text-center py-16 text-gray-400">Brak folderów. Utwórz pierwszy!</div>
            )}
        </div>
    );
}

// --- KOMPONENT 2: ZDJĘCIA W ALBUMIE ---
function AlbumPhotos({ album, canManage, onBack, userUid }: { album: Album, canManage: boolean, onBack: () => void, userUid?: string }) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<Photo | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const q = query(collection(db, "teams", "folkbase", "albums", album.id, "photos"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Photo)));
            setLoading(false);
        });
        return () => unsub();
    }, [album.id]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userUid) return;

        setUploading(true);
        // TOAST: Pokazujemy, że coś się dzieje
        const toastId = toast.loading("Wgrywanie zdjęcia...");

        try {
            const url = await uploadCostumeImage(file);
            await addDoc(collection(db, "teams", "folkbase", "albums", album.id, "photos"), {
                url,
                createdAt: serverTimestamp(),
                uploadedBy: userUid
            });
            toast.success("Zdjęcie dodane!", { id: toastId });
        } catch (error) { 
            console.error(error); 
            toast.error("Błąd wgrywania", { id: toastId });
        } finally { 
            setUploading(false); 
        }
    };

    const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if(!window.confirm("Usunąć zdjęcie?")) return;
        try {
            await deleteDoc(doc(db, "teams", "folkbase", "albums", album.id, "photos", photoId));
            toast.success("Zdjęcie usunięte.");
        } catch (error) {
            console.error(error);
            toast.error("Błąd usuwania.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition">
                        <ArrowLeft size={24} className="text-gray-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Folder size={20} className="text-gray-400"/> {album.title}
                        </h2>
                        <p className="text-xs text-gray-500">Liczba zdjęć: {photos.length}</p>
                    </div>
                </div>

                {canManage && (
                    <div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={uploading}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {uploading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
                            Dodaj zdjęcie
                        </button>
                    </div>
                )}
            </div>

            {loading ? <div className="p-8 text-gray-500">Ładowanie zdjęć...</div> : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map(photo => (
                        <div key={photo.id} onClick={() => setSelectedImage(photo)} className="group relative aspect-square bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden cursor-pointer">
                            <img src={photo.url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="img" />
                            {canManage && (
                                <button onClick={(e) => handleDeletePhoto(photo.id, e)} className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-600 rounded opacity-0 group-hover:opacity-100 transition hover:bg-red-50">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {photos.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400">Ten folder jest pusty.</div>
            )}

            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <button className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={32}/></button>
                    <img src={selectedImage.url} className="max-w-full max-h-[90vh] rounded shadow-2xl" onClick={e => e.stopPropagation()} alt="preview" />
                </div>
            )}
        </div>
    );
}