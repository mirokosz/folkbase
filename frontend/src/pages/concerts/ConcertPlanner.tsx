import { useEffect, useState } from "react";
import { collection, query, getDocs, updateDoc, doc, orderBy } from "firebase/firestore"; // Usunięto 'where', 'onSnapshot'
import { db } from "../../services/firebase";
import { EventItem, RepertoireItem, ProgramItem } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { toDate } from "../../utils/dates";
import { format, addMinutes } from "date-fns";
import { pl } from "date-fns/locale";
import { Plus, Trash2, ArrowUp, ArrowDown, Clock, FileDown, Mic2, Shirt, Music2, Coffee, Star } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { applyPolishFont } from "../../utils/pdfHelper";

export default function ConcertPlanner() {
  const { profile } = useAuth();
  const [concerts, setConcerts] = useState<EventItem[]>([]);
  const [repertoire, setRepertoire] = useState<RepertoireItem[]>([]);
  const [selectedConcertId, setSelectedConcertId] = useState<string>("");
  const [program, setProgram] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);

  const canManage = profile?.role === 'admin' || profile?.role === 'instructor';

  // 1. Pobierz Koncerty i Repertuar
  useEffect(() => {
    const fetchData = async () => {
        // Pobieramy wszystkie i filtrujemy w JS (najbezpieczniejsza opcja bez indeksów)
        const scheduleQ = query(collection(db, "teams", "folkbase", "schedule"), orderBy("startDate", "desc"));
        const repQ = query(collection(db, "teams", "folkbase", "repertoire"), orderBy("title"));

        const [scheduleSnap, repSnap] = await Promise.all([getDocs(scheduleQ), getDocs(repQ)]);

        const allEvents = scheduleSnap.docs.map(d => ({id: d.id, ...d.data()} as EventItem));
        const onlyConcerts = allEvents.filter(e => e.type === 'concert');

        setConcerts(onlyConcerts);
        setRepertoire(repSnap.docs.map(d => ({id: d.id, ...d.data()} as RepertoireItem)));
        setLoading(false);
    };
    fetchData();
  }, []);

  // 2. Gdy wybrano koncert, załaduj jego program
  useEffect(() => {
      if (selectedConcertId) {
          const concert = concerts.find(c => c.id === selectedConcertId);
          if (concert && concert.program) {
              setProgram(concert.program);
          } else {
              setProgram([]);
          }
      }
  }, [selectedConcertId, concerts]);

  const addToProgram = (item: RepertoireItem) => {
      const newItem: ProgramItem = {
          id: Date.now().toString(),
          type: 'repertoire',
          title: item.title,
          duration: 5,
          repertoireId: item.id,
          costume: '',
          description: ''
      };
      setProgram([...program, newItem]);
  };

  const addCustomItem = (type: 'break' | 'announcement' | 'manual') => {
      let title = "Nowy element";
      let duration = 5;
      if (type === 'break') { title = 'Przerwa techniczna'; duration = 10; }
      if (type === 'announcement') { title = 'Zapowiedź'; duration = 2; }
      if (type === 'manual') { title = 'Element Artystyczny'; duration = 5; }

      const newItem: ProgramItem = {
          id: Date.now().toString(),
          type: type === 'manual' ? 'repertoire' : type,
          title: title,
          duration: duration,
          costume: '',
          description: ''
      };
      setProgram([...program, newItem]);
  };

  const updateItem = (id: string, field: keyof ProgramItem, value: any) => {
      setProgram(program.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeItem = (id: string) => {
      setProgram(program.filter(p => p.id !== id));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
      const newProgram = [...program];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newProgram.length) return;
      
      [newProgram[index], newProgram[targetIndex]] = [newProgram[targetIndex], newProgram[index]];
      setProgram(newProgram);
  };

  const saveProgram = async () => {
      if (!selectedConcertId) return;
      try {
          await updateDoc(doc(db, "teams", "folkbase", "schedule", selectedConcertId), {
              program: program
          });
          alert("Program zapisany!");
      } catch (e) { console.error(e); alert("Błąd zapisu"); }
  };

  const generatePDF = () => {
      const concert = concerts.find(c => c.id === selectedConcertId);
      if (!concert) return;

      const doc = new jsPDF();
      
      // Próba załadowania polskiej czcionki (jeśli pliki helperów istnieją)
      try {
        applyPolishFont(doc);
      } catch (e) {
        console.warn("Brak polskiej czcionki, używam domyślnej.", e);
      }

      let currentTime = toDate(concert.startDate);

      doc.setFontSize(22);
      doc.text(concert.title, 14, 20);
      doc.setFontSize(12);
      doc.text(`${format(currentTime, "d MMMM yyyy, HH:mm", {locale: pl})} | ${concert.location}`, 14, 30);

      const tableData = program.map(item => {
          const startTime = format(currentTime, "HH:mm");
          currentTime = addMinutes(currentTime, item.duration);
          
          return [
              startTime,
              item.title,
              `${item.duration} min`,
              item.costume || "-",
              item.description || "-"
          ];
      });

      autoTable(doc, {
          startY: 40,
          head: [['Godz.', 'Punkt Programu', 'Czas', 'Strój', 'Uwagi']],
          body: tableData,
          theme: 'grid',
          styles: { font: "Roboto", fontStyle: "normal" }, // Wymaga załadowanej czcionki w pdfHelper
          headStyles: { fillColor: [79, 70, 229] },
          columnStyles: {
              0: { cellWidth: 20 },
              2: { cellWidth: 20 },
          }
      });

      doc.save(`Program_${concert.title}.pdf`);
  };

  const calculateEndTime = () => {
      if(!selectedConcertId) return null;
      const concert = concerts.find(c => c.id === selectedConcertId);
      if(!concert) return null;
      
      const totalMinutes = program.reduce((acc, curr) => acc + curr.duration, 0);
      const start = toDate(concert.startDate);
      return addMinutes(start, totalMinutes);
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-slate-400">Ładowanie koncertów...</div>;

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Planer Koncertów</h1>
           <p className="text-gray-500 dark:text-slate-400">
               {canManage ? "Twórz scenariusze i listy utworów." : "Pobierz harmonogram wybranych koncertów."}
           </p>
        </div>
      </div>

      {/* WYBÓR KONCERTU */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 shrink-0">
          <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">Wybierz koncert</label>
          <select 
            className="w-full border dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white p-3 rounded-lg outline-none"
            value={selectedConcertId}
            onChange={e => setSelectedConcertId(e.target.value)}
          >
              <option value="">-- Wybierz z listy --</option>
              {concerts.map(c => (
                  <option key={c.id} value={c.id!}>
                      {format(toDate(c.startDate), "dd.MM.yyyy")} - {c.title} ({c.location})
                  </option>
              ))}
          </select>
          {concerts.length === 0 && <p className="text-xs text-red-500 mt-2">Brak koncertów w grafiku.</p>}
      </div>

      {selectedConcertId && (
          <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
              
              {/* LEWA: BANK UTWORÓW - WIDOCZNY TYLKO DLA ADMINA */}
              {canManage && (
                  <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 flex flex-col min-h-0">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <Music2 size={18} /> Repertuar
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-2 mb-4 shrink-0">
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => addCustomItem('announcement')} className="flex items-center justify-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">
                                <Mic2 size={16} /> Zapowiedź
                            </button>
                            <button onClick={() => addCustomItem('break')} className="flex items-center justify-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-900/50 transition">
                                <Coffee size={16} /> Przerwa
                            </button>
                          </div>
                          <button onClick={() => addCustomItem('manual')} className="flex items-center justify-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition">
                              <Star size={16} /> Element artystyczny
                          </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                          {repertoire.map(rep => (
                              <div key={rep.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition group">
                                  <span className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate flex-1">{rep.title}</span>
                                  <button onClick={() => addToProgram(rep)} className="p-1.5 bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 rounded shadow-sm hover:scale-110 transition">
                                      <Plus size={16} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* PRAWA: PROGRAM KONCERTU - DLA MEMBERA NA CAŁĄ SZEROKOŚĆ */}
              <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 flex flex-col min-h-0 ${canManage ? 'w-full lg:w-2/3' : 'w-full max-w-4xl mx-auto'}`}>
                  <div className="flex justify-between items-center mb-4 shrink-0">
                      <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          <Clock size={18} /> Program 
                          <span className="text-xs font-normal text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                              Koniec ok. {format(calculateEndTime() || new Date(), "HH:mm")}
                          </span>
                      </h3>
                      <div className="flex gap-2">
                          {canManage && (
                              <button onClick={saveProgram} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition shadow-sm">
                                  Zapisz
                              </button>
                          )}
                          <button onClick={generatePDF} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
                              <FileDown size={16} /> PDF
                          </button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {program.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-xl">
                              <p>Brak zaplanowanego programu.</p>
                          </div>
                      ) : (
                          program.map((item, idx) => (
                              <div key={item.id} className="flex gap-3 items-start bg-gray-50 dark:bg-slate-700/30 p-3 rounded-xl border border-gray-200 dark:border-slate-600 group">
                                  
                                  <div className="flex flex-col items-center gap-1 w-8 shrink-0">
                                      <span className="text-xs font-bold text-gray-400 dark:text-slate-500">{idx + 1}.</span>
                                      {canManage && (
                                          <>
                                            <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30"><ArrowUp size={14}/></button>
                                            <button onClick={() => moveItem(idx, 1)} disabled={idx === program.length - 1} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30"><ArrowDown size={14}/></button>
                                          </>
                                      )}
                                  </div>

                                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                                      <div className="md:col-span-5">
                                          <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 mb-1 flex">Punkt programu</label>
                                          {canManage ? (
                                              <input className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded p-1.5 text-sm outline-none focus:border-indigo-500 text-gray-800 dark:text-white" 
                                                  value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} />
                                          ) : <p className="text-sm font-medium text-gray-800 dark:text-white py-1.5">{item.title}</p>}
                                      </div>

                                      <div className="md:col-span-2">
                                          {/* POPRAWIONO: usunięto block, zostawiono flex */}
                                          <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1"><Clock size={10}/> Czas (min)</label>
                                          {canManage ? (
                                              <input type="number" className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded p-1.5 text-sm outline-none focus:border-indigo-500 text-gray-800 dark:text-white text-center" 
                                                  value={item.duration} onChange={e => updateItem(item.id, 'duration', Number(e.target.value))} />
                                          ) : <p className="text-sm text-gray-600 dark:text-slate-300 py-1.5 text-center">{item.duration} min</p>}
                                      </div>

                                      <div className="md:col-span-5">
                                          {/* POPRAWIONO: usunięto block, zostawiono flex */}
                                          <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1"><Shirt size={10}/> Strój / Uwagi</label>
                                          {canManage ? (
                                              <input className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded p-1.5 text-sm outline-none focus:border-indigo-500 text-gray-800 dark:text-white" 
                                                  placeholder="np. Krakowski / Mikrofon nr 1"
                                                  value={item.costume} onChange={e => updateItem(item.id, 'costume', e.target.value)} />
                                          ) : <p className="text-sm text-gray-600 dark:text-slate-300 py-1.5">{item.costume || "-"}</p>}
                                      </div>
                                  </div>

                                  {canManage && (
                                      <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition self-center">
                                          <Trash2 size={18} />
                                      </button>
                                  )}
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}