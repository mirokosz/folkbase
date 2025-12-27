import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { uploadAvatar } from "../../services/mediaService";
import { MemberProfile, UserRole } from "../../types";
import { User, Phone, MapPin, Calendar, Ruler, Hash, Mail, Edit2, Save, X, ArrowLeft, Camera, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import CostumeManager from "./CostumeManager";

export default function Profile() {
  const { user, profile: currentUserProfile } = useAuth(); 
  const { id } = useParams();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<MemberProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState<Partial<MemberProfile>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !id || id === user?.uid;
  const targetId = id ? id : user?.uid;
  const canEdit = isOwnProfile || currentUserProfile?.role === 'admin';
  const isAdmin = currentUserProfile?.role === 'admin';

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
      if (!targetId || !profileData) return;
      try {
          await updateDoc(doc(db, "teams", "folkbase", "members", targetId), formData);
          
          setProfileData({ ...profileData, ...formData } as MemberProfile);
          
          setIsEditing(false);
          alert("Profil zaktualizowany!");
      } catch (error) {
          console.error(error);
          alert("Błąd zapisu. Sprawdź uprawnienia lub połączenie.");
      }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !targetId) return;

      setUploadingAvatar(true);
      try {
          const url = await uploadAvatar(file, targetId);
          await updateDoc(doc(db, "teams", "folkbase", "members", targetId), { photoUrl: url });
          
          setProfileData(prev => prev ? ({ ...prev, photoUrl: url }) : null);
          setFormData(prev => ({ ...prev, photoUrl: url }));
      } catch (error) {
          console.error("Avatar upload failed:", error);
          alert("Nie udało się wgrać zdjęcia.");
      } finally {
          setUploadingAvatar(false);
      }
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-slate-400">Ładowanie profilu...</div>;
  if (!profileData) return <div className="p-8 text-gray-500 dark:text-slate-400">Nie znaleziono profilu lub brak uprawnień.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      
      {!isOwnProfile && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition mb-4">
              <ArrowLeft size={20} /> Wróć do listy
          </button>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative transition-colors">
        
        {canEdit && (
            <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`absolute top-6 right-6 p-2 rounded-lg transition ${isEditing ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
                title={isEditing ? "Anuluj edycję" : "Edytuj profil"}
            >
                {isEditing ? <X size={24} /> : <Edit2 size={24} />}
            </button>
        )}

        <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg shrink-0 overflow-hidden border-4 border-white dark:border-slate-700">
                {profileData.photoUrl ? (
                    <img src={profileData.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span>{profileData.firstName[0]}{profileData.lastName[0]}</span>
                )}
                
                {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white" size={32} />
                    </div>
                )}
            </div>

            {isEditing && (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-700 rounded-full shadow-md cursor-pointer hover:scale-110 transition text-gray-600 dark:text-slate-200 border border-gray-200 dark:border-slate-600"
                    title="Zmień zdjęcie"
                >
                    <Camera size={20} />
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                </div>
            )}
        </div>

        <div className="text-center md:text-left space-y-3 flex-1 w-full">
            <div>
                {/* ZMIANA: Imię i Nazwisko edytowalne TYLKO dla Admina */}
                {isEditing && isAdmin ? (
                    <div className="flex gap-2 justify-center md:justify-start">
                        <input className="text-2xl font-bold border-b border-gray-300 dark:border-slate-600 bg-transparent outline-none w-1/3" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Imię" />
                        <input className="text-2xl font-bold border-b border-gray-300 dark:border-slate-600 bg-transparent outline-none w-1/3" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Nazwisko" />
                    </div>
                ) : (
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{profileData.firstName} {profileData.lastName}</h1>
                )}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                {isEditing && isAdmin ? (
                    <select 
                        className="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm outline-none border border-transparent focus:border-indigo-500"
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                    >
                        <option value="member">Członek</option>
                        <option value="instructor">Instruktor</option>
                        <option value="admin">Administrator</option>
                    </select>
                ) : (
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                        {profileData.role === 'member' ? 'Tancerz' : profileData.role}
                    </span>
                )}

                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${profileData.status === 'active' ? 'border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400' : 'border-gray-200 text-gray-500'}`}>
                    {profileData.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
                </span>
            </div>
           
            <div className="pt-4 flex flex-col md:flex-row gap-6 text-gray-500 dark:text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                    <Mail size={16} /> 
                    {/* ZMIANA: Email edytowalny TYLKO dla Admina */}
                    {isEditing && isAdmin ? (
                        <input className="border-b border-gray-300 dark:border-slate-600 bg-transparent outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    ) : profileData.email}
                </div>
                <div className="flex items-center gap-2">
                    <Phone size={16} />
                    {isEditing ? (
                        <input className="border-b border-gray-300 dark:border-slate-600 bg-transparent outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Telefon" />
                    ) : (profileData.phone || "Brak telefonu")}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 transition-colors">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-3">
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

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 transition-colors">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-3">
                  <Ruler size={20} className="text-indigo-600 dark:text-indigo-400" /> Parametry i Zespół
              </h3>
              
              <div className="space-y-4">
                  <InputGroup label="Data wstąpienia" icon={<Calendar size={16}/>} isEditing={isEditing && isAdmin} 
                      value={formData.joinDate} onChange={(v: string) => setFormData({...formData, joinDate: v})} type="date" />
                  
                  <InputGroup label="Wzrost (cm)" icon={<Ruler size={16}/>} isEditing={isEditing} 
                      value={formData.height} onChange={(v: string) => setFormData({...formData, height: Number(v)})} type="number" />
                  
                  <InputGroup label="Numer Dowodu" icon={<Hash size={16}/>} isEditing={isEditing} 
                      value={formData.idNumber} onChange={(v: string) => setFormData({...formData, idNumber: v})} />
              </div>
          </div>

          {profileData?.uid && (
              <div className="md:col-span-2">
                  <CostumeManager memberId={profileData.uid} />
              </div>
          )}
      </div>

      {isEditing && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
              <button 
                onClick={handleSave}
                className="bg-indigo-600 text-white px-6 py-4 rounded-full font-bold shadow-xl hover:bg-indigo-700 transition flex items-center gap-2 hover:scale-105"
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
            <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                {icon} {label}
            </label>
            {isEditing ? (
                <input 
                    type={type}
                    className="w-full border dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                />
            ) : (
                <p className="text-gray-800 dark:text-slate-200 font-medium h-10 flex items-center border-b border-transparent">
                    {value || <span className="text-gray-300 dark:text-slate-600 italic text-sm">Brak danych</span>}
                </p>
            )}
        </div>
    )
}