import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { Poll, MemberProfile } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { toDate } from "../../utils/dates";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Plus, Trash2, CheckCircle2, X, Users, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { applyPolishFont } from "../../utils/pdfHelper";
// NOWY IMPORT
import { sendNotificationToAll } from "../../utils/emailNotification";

export default function Polls() {
  const { user, profile } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canManage = profile?.role === 'admin' || profile?.role === 'instructor';

  useEffect(() => {
    const q = query(collection(db, "teams", "folkbase", "polls"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
      setPolls(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
        const snap = await getDocs(collection(db, "teams", "folkbase", "members"));
        setMembers(snap.docs.map(d => d.data() as MemberProfile));
    };
    fetchMembers();
  }, []);

  const handleVote = async (poll: Poll, optionIndex: number) => {
      if (!user || canManage) return;
      const newVotes = { ...poll.votes, [user.uid]: optionIndex };
      try {
          await updateDoc(doc(db, "teams", "folkbase", "polls", poll.id), { votes: newVotes });
      } catch (e) { console.error(e); alert("Błąd głosowania"); }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Usunąć tę ankietę?")) return;
      await deleteDoc(doc(db, "teams", "folkbase", "polls", id));
  };

  const toggleActive = async (poll: Poll) => {
      await updateDoc(doc(db, "teams", "folkbase", "polls", poll.id), { isActive: !poll.isActive });
  };

  const getName = (uid: string) => {
      const m = members.find(mem => mem.uid === uid || mem.id === uid);
      return m ? `${m.firstName} ${m.lastName}` : "Nieznany";
  };

  const downloadReport = (poll: Poll) => {
      const doc = new jsPDF();
      applyPolishFont(doc);

      doc.setFontSize(18);
      doc.text("Raport z ankiety FolkBase", 14, 15);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Pytanie: ${poll.question}`, 14, 25);
      doc.text(`Data utworzenia: ${format(toDate(poll.createdAt), "dd.MM.yyyy")}`, 14, 32);

      const tableRows = poll.options.map((option, idx) => {
          const votesForThisOption = Object.entries(poll.votes || {}).filter(([, val]) => val === idx);
          const count = votesForThisOption.length;
          const names = votesForThisOption.map(([uid]) => getName(uid)).join(", ");
          return [option, count, names];
      });

      autoTable(doc, {
          startY: 40,
          head: [['Opcja', 'Liczba głosów', 'Głosujący']],
          body: tableRows,
          theme: 'grid',
          styles: { font: "Roboto", fontStyle: "normal", fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [79, 70, 229] },
          columnStyles: {
              0: { cellWidth: 40, fontStyle: 'bold' },
              1: { cellWidth: 30, halign: 'center' },
              2: { cellWidth: 'auto' }
          }
      });

      doc.save(`ankieta_wyniki.pdf`);
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-slate-400">Ładowanie ankiet...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ankiety i Głosowania</h1>
           <p className="text-gray-500 dark:text-slate-400">Wspólne decyzje zespołu.</p>
        </div>
        {canManage && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm">
                <Plus size={20} /> Utwórz Ankietę
            </button>
        )}
      </div>

      <div className="grid gap-6">
        {polls.map(poll => {
            const totalVotes = Object.keys(poll.votes || {}).length;
            const myVote = poll.votes?.[user?.uid || ""]; 

            return (
                <div key={poll.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border p-6 transition-all ${poll.isActive ? 'border-gray-200 dark:border-slate-700' : 'border-gray-100 dark:border-slate-800 opacity-75 grayscale-[0.5]'}`}>
                    
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {!poll.isActive && <span className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Zakończona</span>}
                                <span className="text-xs text-gray-400 dark:text-slate-500">{format(toDate(poll.createdAt), "d MMMM yyyy", {locale: pl})}</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">{poll.question}</h3>
                        </div>
                        {canManage && (
                            <div className="flex gap-2">
                                <button onClick={() => downloadReport(poll)} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition px-2" title="Pobierz PDF">
                                    <Download size={18} />
                                </button>
                                <button onClick={() => toggleActive(poll)} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline px-2">
                                    {poll.isActive ? "Zakończ" : "Otwórz"}
                                </button>
                                <button onClick={() => handleDelete(poll.id)} className="text-gray-400 hover:text-red-500 transition px-2">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {poll.options.map((option, idx) => {
                            const votesForThisOption = Object.entries(poll.votes || {}).filter(([, val]) => val === idx);
                            const count = votesForThisOption.length;
                            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                            const isSelected = myVote === idx;

                            return (
                                <div key={idx} className="space-y-2">
                                    <button 
                                        onClick={() => !canManage && poll.isActive && handleVote(poll, idx)}
                                        disabled={!poll.isActive || canManage}
                                        className={`relative w-full text-left p-3 rounded-xl border-2 transition-all overflow-hidden group
                                            ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800'}
                                            ${!canManage && poll.isActive ? 'hover:border-indigo-200 dark:hover:border-slate-600 cursor-pointer' : 'cursor-default'}
                                        `}
                                    >
                                        <div className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ease-out opacity-10 dark:opacity-20 ${isSelected ? 'bg-indigo-500' : 'bg-gray-400'}`} style={{ width: `${percentage}%` }}></div>
                                        <div className="relative z-10 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 dark:border-slate-600'}`}>
                                                    {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                                </div>
                                                <span className={`font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-slate-300'}`}>{option}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-500 dark:text-slate-400">{percentage}% ({count})</span>
                                        </div>
                                    </button>
                                    {canManage && count > 0 && (
                                        <div className="ml-4 pl-4 border-l-2 border-indigo-100 dark:border-slate-700">
                                            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 mb-1.5 flex items-center gap-1"><Users size={10} /> Głosowali:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {votesForThisOption.map(([uid]) => (
                                                    <div key={uid} className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-700/50 px-2 py-1 rounded-md border border-gray-100 dark:border-slate-700">
                                                        <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[9px] font-bold text-indigo-700 dark:text-indigo-300">{getName(uid).charAt(0)}</div>
                                                        <span className="text-xs text-gray-600 dark:text-slate-300 font-medium">{getName(uid)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <div className="mt-4 text-xs text-gray-400 dark:text-slate-500 text-right">
                        Łącznie głosów: {totalVotes}
                        {canManage && <span className="ml-2 text-indigo-500">(Widok Administratora)</span>}
                    </div>
                </div>
            )
        })}
        {polls.length === 0 && <div className="text-center py-12 text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">Brak aktywnych ankiet.</div>}
      </div>
      {isModalOpen && <CreatePollModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

function CreatePollModal({ onClose }: { onClose: () => void }) {
    const { user } = useAuth();
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["Tak", "Nie"]); 
    const [sendEmail, setSendEmail] = useState(true); // --- NOWY STAN (CHECKBOX)

    const handleOptionChange = (idx: number, val: string) => {
        const newOptions = [...options];
        newOptions[idx] = val;
        setOptions(newOptions);
    };

    const addOption = () => setOptions([...options, ""]);
    const removeOption = (idx: number) => setOptions(options.filter((_opt, i) => i !== idx));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validOptions = options.filter(o => o.trim() !== "");
        if (validOptions.length < 2) return alert("Podaj co najmniej 2 opcje!");

        try {
            await addDoc(collection(db, "teams", "folkbase", "polls"), {
                question, options: validOptions, votes: {}, isActive: true, createdAt: serverTimestamp(), createdBy: user?.uid
            });

            // --- WYSYŁKA MAILA ---
            if (sendEmail) {
                await sendNotificationToAll({
                    type: "Nowa Ankieta",
                    title: question,
                    message: "Prosimy o oddanie głosu w aplikacji."
                });
                alert("Ankieta dodana i powiadomienia wysłane!");
            } else {
                alert("Ankieta dodana (bez powiadomień).");
            }
            // ---------------------

            onClose();
        } catch (e) { console.error(e); alert("Błąd zapisu"); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Nowa Ankieta</h2>
                    <button onClick={onClose}><X size={24} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Pytanie</label>
                        <input required className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Np. Czy jedziemy na festiwal?" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">Opcje odpowiedzi</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {options.map((opt, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input required className="flex-1 border dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={opt} onChange={e => handleOptionChange(idx, e.target.value)} placeholder={`Opcja ${idx + 1}`} />
                                    {options.length > 2 && (
                                        <button type="button" onClick={() => removeOption(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addOption} className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"><Plus size={14} /> Dodaj kolejną opcję</button>
                    </div>

                    {/* --- CHECKBOX EMAIL --- */}
                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="sendEmail" 
                            checked={sendEmail} 
                            onChange={e => setSendEmail(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <label htmlFor="sendEmail" className="text-sm text-gray-600 dark:text-slate-300">Wyślij powiadomienie e-mail do członków</label>
                    </div>
                    {/* ---------------------- */}

                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition w-full">Opublikuj Ankietę</button>
                    </div>
                </form>
            </div>
        </div>
    )
}