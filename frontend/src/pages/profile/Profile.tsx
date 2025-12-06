import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { MemberProfile } from "../../types";
import { User, Phone, MapPin, Calendar, Ruler, Hash, Mail, Edit2, Save, X, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import CostumeManager from "./CostumeManager"; // <--- NOWY IMPORT

export default function Profile() {
  const { user, profile: currentUserProfile } = useAuth(); 
  const { id } = useParams();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<MemberProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<Partial<MemberProfile>>({});

  const targetId = id && (currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'instructor') 
    ? id 
    : user?.uid;

  const canEdit = targetId === user?.uid || currentUserProfile?.role === 'admin';

  useEffect(() => {
    const fetchProfile = async () => {
      if (targetId) {
        const docRef = doc(db, "teams", "folkbase", "members", targetId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as MemberProfile;
          setProfileData(data);
          setFormData(data);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [targetId]);

  const handleSave = async () => {
      if (!targetId) return;
      try {
          await updateDoc(doc(db, "teams", "folkbase", "members", targetId), formData);
          // @ts-expect-error - ignorujemy brak wszystkich pól przy łączeniu
          setProfileData({ ...profileData, ...formData });
          setIsEditing(false);
          alert("Profil zaktualizowany!");
      } catch (error) {
          console.error(error);
          alert("Błąd zapisu.");
      }
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-slate-400">Ładowanie profilu...</div>;
  if (!profileData) return <div className="p-8 text-gray-500 dark:text-slate-400">Nie znaleziono profilu lub brak uprawnień.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      
      {id && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition mb-4">
              <ArrowLeft size={20} /> Wróć do listy
          </button>
      )}

      {/* HEADER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative transition-colors">
        
        {canEdit && (
            <button 
                onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"
            >
                {isEditing ? <X size={24} /> : <Edit2 size={24} />}
            </button>
        )}

        <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg shrink-0">
            {profileData.firstName[0]}{profileData.lastName[0]}
        </div>

        <div className="text-center md:text-left space-y-2 flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{profileData.firstName} {profileData.lastName}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                    {profileData.role}
                </span>
                <span className={`w-3 h-3 rounded-full ${profileData.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </div>
            
            <div className="pt-4 flex flex-col md:flex-row gap-4 text-gray-500 dark:text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                    <Mail size={16} /> {profileData.email}
                </div>
                {profileData.phone && (
                    <div className="flex items-center gap-2">
                        <Phone size={16} /> {profileData.phone}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* SZCZEGÓŁY - GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* KARTA 1: DANE OSOBOWE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 border-b dark:border-slate-700 pb-2">
                  <User size={20} className="text-indigo-600 dark:text-indigo-400" /> Dane Osobowe
              </h3>
              
              <div className="space-y-4">
                  <InputGroup label="Data urodzenia" icon={<Calendar size={16}/>} isEditing={isEditing} 
                      value={formData.birthDate} onChange={(v: string) => setFormData({...formData, birthDate: v})} type="date" />
                  
                  <InputGroup label="Miejsce urodzenia" icon={<MapPin size={16}/>} isEditing={isEditing} 
                      value={formData.placeOfBirth} onChange={(v: string) => setFormData({...formData, placeOfBirth: v})} />
                  
                  <InputGroup label="PESEL" icon={<Hash size={16}/>} isEditing={isEditing} 
                      value={formData.pesel} onChange={(v: string) => setFormData({...formData, pesel: v})} />
                  
                  <InputGroup label="Adres zamieszkania" icon={<MapPin size={16}/>} isEditing={isEditing} 
                      value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} />
              </div>
          </div>

          {/* KARTA 2: DANE ZESPOŁOWE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 border-b dark:border-slate-700 pb-2">
                  <Ruler size={20} className="text-indigo-600 dark:text-indigo-400" /> Parametry i Zespół
              </h3>
              
              <div className="space-y-4">
                  <InputGroup label="Data wstąpienia" icon={<Calendar size={16}/>} isEditing={isEditing} 
                      value={formData.joinDate} onChange={(v: string) => setFormData({...formData, joinDate: v})} type="date" />
                  
                  <InputGroup label="Wzrost (cm)" icon={<Ruler size={16}/>} isEditing={isEditing} 
                      value={formData.height} onChange={(v: string) => setFormData({...formData, height: Number(v)})} type="number" />
                  
                  <InputGroup label="Numer Dowodu" icon={<Hash size={16}/>} isEditing={isEditing} 
                      value={formData.idNumber} onChange={(v: string) => setFormData({...formData, idNumber: v})} />
              </div>
          </div>

          {/* --- NOWOŚĆ: MODUŁ STROJÓW (ROZCIĄGNIĘTY NA DOLE) --- */}
          {profileData?.uid && (
              <div className="md:col-span-2">
                  <CostumeManager memberId={profileData.uid} />
              </div>
          )}

      </div>

      {isEditing && (
          <div className="flex justify-end">
              <button 
                onClick={handleSave}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                  <Save size={20} /> Zapisz zmiany
              </button>
          </div>
      )}
    </div>
  );
}

interface InputGroupProps {
    label: string;
    value: any;
    onChange: (val: string) => void;
    isEditing: boolean;
    icon: any;
    type?: string;
}

function InputGroup({ label, value, onChange, isEditing, icon, type = "text" }: InputGroupProps) {
    return (
        <div>
            <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase mb-1 flex items-center gap-1">
                {icon} {label}
            </label>
            {isEditing ? (
                <input 
                    type={type}
                    className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                />
            ) : (
                <p className="text-gray-800 dark:text-slate-200 font-medium h-9 flex items-center border border-transparent">
                    {value || <span className="text-gray-300 dark:text-slate-600 italic">Brak danych</span>}
                </p>
            )}
        </div>
    )
}