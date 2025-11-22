import React, { useState, useEffect } from 'react';
import { addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { HelpCircle, Plus, Loader2, Edit, Trash2, AlertCircle, Award } from 'lucide-react';

// Poprawka: Używamy 'import type' dla definicji typów
import type { Question, QuizResult, Member } from '../types/data';
// Poprawka: Poprawne ścieżki względne
import { QUIZ_CATEGORIES } from '../config/constants';
import { getTeamCollectionRef, getTeamDocRef } from '../firebase';
import Modal from '../components/common/Modal';

// --- Komponent Wewnętrzny: Modal Formularza Pytania Quizowego ---
interface QuestionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    currentQuestion?: Question | null;
}

const QuestionFormModal: React.FC<QuestionFormModalProps> = ({ isOpen, onClose, teamId, currentQuestion = null }) => {
    const [questionText, setQuestionText] = useState(currentQuestion?.questionText || '');
    const [options, setOptions] = useState(currentQuestion?.options || ['', '', '', '']);
    const [correctOptionIndex, setCorrectOptionIndex] = useState(currentQuestion?.correctOptionIndex || 0);
    const [category, setCategory] = useState(currentQuestion?.category || QUIZ_CATEGORIES[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setQuestionText(currentQuestion?.questionText || '');
            setOptions(currentQuestion?.options || ['', '', '', '']);
            setCorrectOptionIndex(currentQuestion?.correctOptionIndex || 0);
            setCategory(currentQuestion?.category || QUIZ_CATEGORIES[0]);
            setLoading(false);
        }
    }, [isOpen, currentQuestion]);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const hasEmptyOption = options.some(opt => opt.trim() === '');
        if (hasEmptyOption) {
            alert("Wszystkie 4 opcje odpowiedzi muszą być wypełnione.");
            setLoading(false);
            return;
        }

        const questionData = {
            questionText,
            options,
            correctOptionIndex: Number(correctOptionIndex), // Upewnij się, że to liczba
            category,
            teamId,
            updatedAt: serverTimestamp(),
        };

        try {
            if (currentQuestion) {
                await updateDoc(getTeamDocRef(teamId, 'quizQuestions', currentQuestion.id), questionData);
            } else {
                await addDoc(getTeamCollectionRef(teamId, 'quizQuestions'), { ...questionData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (error) {
            console.error("Błąd zapisu pytania quizowego:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={currentQuestion ? 'Edytuj Pytanie Quizowe' : 'Dodaj Nowe Pytanie Quizowe'} maxWidth='max-w-2xl'>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="questionText" className="block text-sm font-medium text-gray-700">Pytanie</label>
                        <textarea id="questionText" value={questionText} onChange={(e) => setQuestionText(e.target.value)} required rows={2} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategoria</label>
                        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white">
                            {QUIZ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <fieldset>
                        <legend className="text-sm font-medium text-gray-700 mb-2">Opcje Odpowiedzi (Zaznacz poprawną)</legend>
                        <div className="space-y-2">
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        id={`option-${index}`}
                                        name="correct-option"
                                        type="radio"
                                        value={index}
                                        checked={correctOptionIndex === index}
                                        onChange={() => setCorrectOptionIndex(index)}
                                        className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder={`Opcja ${index + 1}`}
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        required
                                        className={`flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border ${correctOptionIndex === index ? 'bg-green-50 border-green-400' : ''}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </fieldset>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" disabled={loading}>Anuluj</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center" disabled={loading || !questionText}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {currentQuestion ? 'Zapisz Zmiany' : 'Dodaj Pytanie'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- Interfejs Wewnętrzny: Zarządzanie Quizem (dla admina) ---
interface QuizManagementModuleProps {
    questions: Question[];
    quizResults: QuizResult[];
    teamId: string;
}

const QuizManagementModule: React.FC<QuizManagementModuleProps> = ({ questions, quizResults, teamId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
    const [viewMode, setViewMode] = useState<'questions' | 'results'>('questions');

    const openModal = (question: Question | null = null) => {
        setQuestionToEdit(question);
        setIsModalOpen(true);
    };

    const handleDeleteQuestion = async (questionId: string, questionText: string) => {
        if (!confirm(`Czy na pewno usunąć pytanie: "${questionText.substring(0, 50)}..."?`)) return;
        try {
            await deleteDoc(getTeamDocRef(teamId, 'quizQuestions', questionId));
        } catch (error) {
            console.error("Błąd usuwania pytania quizowego:", error);
        }
    };

    const sortedResults = quizResults.sort((a, b) => b.score - a.score);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-3">
                    <button onClick={() => setViewMode('questions')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'questions' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        Pytania ({questions.length})
                    </button>
                    <button onClick={() => setViewMode('results')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'results' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        Wyniki ({quizResults.length})
                    </button>
                </div>
                {viewMode === 'questions' && (
                    <button onClick={() => openModal(null)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors">
                        <Plus className="w-5 h-5 mr-2" /> Dodaj Pytanie
                    </button>
                )}
            </div>

            {viewMode === 'questions' && (
                <div className="space-y-4">
                    {questions.length === 0 ? (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" /> Brak pytań. Dodaj pytania, aby quiz był aktywny!
                        </div>
                    ) : (
                        questions.map(q => (
                            <div key={q.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                                <div className="flex justify-between items-start">
                                    <div className='flex-1 pr-4'>
                                        <p className="text-base font-semibold text-gray-800 mb-2">{q.questionText}</p>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            {q.options.map((option, index) => (
                                                <span key={index} className={`px-2 py-0.5 rounded-full ${index === q.correctOptionIndex ? 'bg-green-200 text-green-800 font-bold' : 'bg-gray-100 text-gray-600'}`}>
                                                    {index + 1}. {option}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex space-x-1">
                                        <button onClick={() => openModal(q)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100" title="Edytuj"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteQuestion(q.id, q.questionText)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100" title="Usuń"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <p className="text-xs text-indigo-500 mt-2">Kategoria: {q.category}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {viewMode === 'results' && (
                <div className="overflow-x-auto bg-gray-50 rounded-xl shadow-inner">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Członek</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wynik</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedResults.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">Brak zapisanych wyników quizu.</td></tr>
                            ) : (
                                sortedResults.map((r, index) => (
                                    <tr key={r.id} className="hover:bg-indigo-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {index === 0 && <Award className="w-4 h-4 text-yellow-500 inline mr-2" />}
                                            {r.userName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                                            {r.score} / {r.totalQuestions}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {r.timestamp.toLocaleDateString('pl-PL')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            
            <QuestionFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} teamId={teamId} currentQuestion={questionToEdit} />
        </div>
    );
};

// --- Interfejs Wewnętrzny: Rozgrywanie Quizu (dla członków) ---
interface QuizPlayerModuleProps {
    questions: Question[];
    members: Member[];
    currentUserId: string;
    teamId: string;
}

const QuizPlayerModule: React.FC<QuizPlayerModuleProps> = ({ questions, members, currentUserId, teamId }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswers, setCurrentAnswers] = useState<{ [key: number]: number }>({});
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Używamy 'useState' aby upewnić się, że pytania są losowane tylko raz na render
    const [questionsToPlay] = useState(() => [...questions].sort(() => 0.5 - Math.random()).slice(0, 10));
    const totalQuestions = questionsToPlay.length;

    const handleAnswer = (questionIndex: number, answerIndex: number) => {
        setCurrentAnswers(prev => ({
            ...prev,
            [questionIndex]: answerIndex
        }));
    };

    const handleSubmitQuiz = async () => {
        setLoading(true);
        let currentScore = 0;
        for (let i = 0; i < totalQuestions; i++) {
            const question = questionsToPlay[i];
            if (currentAnswers[i] === question.correctOptionIndex) {
                currentScore++;
            }
        }
        setScore(currentScore);
        setIsFinished(true);

        const currentUser = members.find(m => m.id === currentUserId) || { name: "Anonimowy Członek" };

        const resultData = {
            userId: currentUserId,
            userName: currentUser.name,
            score: currentScore,
            totalQuestions,
            timestamp: serverTimestamp(), // Używamy serverTimestamp dla spójności
            teamId,
        };
        
        try {
            await addDoc(getTeamCollectionRef(teamId, 'quizResults'), resultData);
        } catch (error) {
            console.error("Błąd zapisu wyniku quizu:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetQuiz = () => {
        // Zresetuj stan, aby zagrać ponownie (ale z tymi samymi pytaniami)
        setCurrentQuestionIndex(0);
        setCurrentAnswers({});
        setScore(0);
        setIsFinished(false);
        setLoading(false);
    };

    if (totalQuestions === 0) {
        return <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" /> Instruktorzy nie dodali jeszcze żadnych pytań do quizu.
        </div>;
    }

    if (isFinished) {
        return (
            <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800">Quiz Zakończony!</h2>
                <p className="text-4xl font-bold text-indigo-600 my-4">{score} / {totalQuestions}</p>
                <p className="text-lg text-gray-600">Twój wynik został zapisany w rankingu.</p>
                <button onClick={resetQuiz} className="mt-6 px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                    Zagraj Ponownie
                </button>
            </div>
        );
    }

    const question = questionsToPlay[currentQuestionIndex];
    const selectedAnswer = currentAnswers[currentQuestionIndex];

    return (
        <div>
            <div className="text-sm text-gray-500 mb-2">Pytanie {currentQuestionIndex + 1} z {totalQuestions} (Kategoria: {question.category})</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{question.questionText}</h2>
            
            <div className="space-y-3">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswer(currentQuestionIndex, index)}
                        className={`block w-full text-left p-4 rounded-lg border-2 transition-all
                            ${selectedAnswer === index
                                ? 'bg-indigo-100 border-indigo-600 shadow-md' // Zaznaczona odpowiedź
                                : 'bg-white border-gray-200 hover:bg-indigo-50 hover:border-indigo-300' // Niezaznaczona
                            }`}
                    >
                        <span className={`font-medium ${selectedAnswer === index ? 'text-indigo-800' : 'text-gray-700'}`}>
                            {index + 1}. {option}
                        </span>
                    </button>
                ))}
            </div>

            <div className="mt-8 flex justify-between items-center">
                <button 
                    onClick={() => setCurrentQuestionIndex(i => i - 1)} 
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={currentQuestionIndex === 0}
                >
                    Poprzednie
                </button>
                
                {currentQuestionIndex === totalQuestions - 1 ? (
                    // Przycisk Zakończ
                    <button 
                        onClick={handleSubmitQuiz} 
                        className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md flex items-center" 
                        disabled={loading || selectedAnswer === undefined}
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
                        Zakończ Quiz
                    </button>
                ) : (
                    // Przycisk Następne
                    <button 
                        onClick={() => setCurrentQuestionIndex(i => i + 1)} 
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                        disabled={selectedAnswer === undefined}
                    >
                        Następne
                    </button>
                )}
            </div>
        </div>
    );
};


// --- Główny Komponent Modułu Quizu (Router) ---
interface QuizModuleProps {
    isInstructor: boolean;
    questions: Question[];
    quizResults: QuizResult[];
    members: Member[];
    currentUserId: string;
    teamId: string;
}

/**
 * Moduł Quizu.
 * Ten komponent działa jak router - sprawdza, czy użytkownik jest instruktorem.
 * Jeśli tak - pokazuje panel zarządzania.
 * Jeśli nie - pokazuje interfejs gracza.
 */
const QuizModule: React.FC<QuizModuleProps> = (props) => {
    return (
        <div className="p-6 bg-white rounded-xl shadow-lg h-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <HelpCircle className="w-7 h-7 mr-3 text-indigo-600" /> Quiz Folklorystyczny
            </h1>
            
            {props.isInstructor ? (
                // Widok Instruktora (Zarządzanie)
                <QuizManagementModule 
                    questions={props.questions} 
                    quizResults={props.quizResults} 
                    teamId={props.teamId} 
                />
            ) : (
                // Widok Członka (Gracz)
                <QuizPlayerModule 
                    questions={props.questions} 
                    members={props.members} 
                    currentUserId={props.currentUserId} 
                    teamId={props.teamId} 
                />
            )}
        </div>
    );
};

export default QuizModule;