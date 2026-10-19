import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  FileAudio,
  Globe2,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Volume2,
  Sun,
  Moon,
  Bookmark,
  Folder,
  Trash2,
  Crown,
  User,
  LogOut,
  Edit3,
  Mail,
  HelpCircle,
  CheckCircle2,
  CreditCard,
  QrCode,
  Lock,
} from 'lucide-react';

interface SavedNote {
  id: string;
  title: string;
  date: string;
  transcription: string;
  translation: string;
  summaryOverview: string;
  durationSeconds: number;
}

interface UserProfile {
  name: string;
  email: string;
  provider: 'google' | 'apple';
  isPro: boolean;
  planType?: 'monthly' | 'quarterly' | 'annual';
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<
    'transcribe' | 'translate' | 'summary' | 'saved'
  >('transcribe');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Modais de Controle
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showPlansModal, setShowPlansModal] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);

  // Estados de Pagamento e Seleção
  const [selectedPlan, setSelectedPlan] = useState<
    'monthly' | 'quarterly' | 'annual'
  >('annual');
  const [paymentMethod, setPaymentMethod] = useState<
    'applepay' | 'pix' | 'card'
  >('applepay');
  const [isProcessingPayment, setIsProcessingPayment] =
    useState<boolean>(false);

  // Gravador e Áudio
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Título Personalizado
  const [customTitle, setCustomTitle] = useState<string>('');

  // Conteúdo das Abas
  const [transcription, setTranscription] = useState<string>(
    'Grave um áudio ou anexe um ficheiro e clique em "Gerar" para ver a transcrição, tradução e resumo.'
  );
  const [translation, setTranslation] = useState<string>(
    'Record an audio or upload a file and click "Generate" to see transcription, translation, and summary.'
  );
  const [summary, setSummary] = useState<{
    overview: string;
    keyPoints: string[];
  } | null>({
    overview: 'Resumo executivo do conteúdo Note Verse.',
    keyPoints: [
      'Processamento inteligente de áudio',
      'Resultados instantâneos com IA',
    ],
  });
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const localData = localStorage.getItem('noteverse_saved');
    if (localData) {
      try {
        setSavedNotes(JSON.parse(localData));
      } catch (e) {}
    }

    const localUser = localStorage.getItem('noteverse_user');
    if (localUser) {
      try {
        setUser(JSON.parse(localUser));
      } catch (e) {}
    }
  }, []);

  // Timer de Gravação
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (!user?.isPro && prev >= 60) {
            handleStopRecordingDueToLimit();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording, user]);

  const handleStopRecordingDueToLimit = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
    setShowPaywall(true);
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setRecordingTime(0);
      setAudioUrl(null);

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onresult = (event: any) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript + ' ';
          }
          if (currentText.trim()) {
            setTranscription(currentText.trim());
            setTranslation(`[Tradução]: ${currentText.trim()}`);
            setCustomTitle(currentText.trim().slice(0, 30) + '...');
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      } else {
        setIsRecording(true);
        setTimeout(() => {
          setIsRecording(false);
          setCustomTitle('Gravação de Voz');
        }, 3000);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isAudioType = file.type.startsWith('audio/');
      const hasAudioExtension = /\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(
        file.name
      );

      if (!isAudioType && !hasAudioExtension) {
        alert(
          'Por favor, selecione apenas ficheiros de áudio válidos (MP3, WAV, M4A, etc.).'
        );
        return;
      }

      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  // Função do Botão Gerar
  const handleGenerateContent = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const generatedText =
        'Nota gerada com sucesso! O sistema processou o seu áudio e estruturou todas as informações detalhadas.';
      setTranscription(generatedText);
      setTranslation(`[English Translation]: Successfully generated note based on audio input.`);
      setSummary({
        overview: 'Resumo executivo gerado automaticamente a partir do áudio.',
        keyPoints: [
          'Áudio processado e validado com sucesso',
          'Tradução e sumário estruturados em tempo real',
        ],
      });
      setIsProcessing(false);
    }, 2500);
  };

  const handleOpenSaveModal = () => {
    if (!transcription) return;
    if (!customTitle) setCustomTitle(transcription.slice(0, 25) + '...');
    setShowSaveModal(true);
  };

  const handleConfirmSaveNote = () => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString(
      'pt-PT'
    )} às ${now.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;

    const newNote: SavedNote = {
      id: Date.now().toString(),
      title: customTitle || 'Documento sem título',
      date: formattedDate,
      transcription,
      translation,
      summaryOverview: summary?.overview || '',
      durationSeconds: recordingTime,
    };

    const updated = [newNote, ...savedNotes];
    setSavedNotes(updated);
    localStorage.setItem('noteverse_saved', JSON.stringify(updated));
    setShowSaveModal(false);
    setActiveTab('saved');
  };

  const handleDeleteNote = (id: string) => {
    const updated = savedNotes.filter((n) => n.id !== id);
    setSavedNotes(updated);
    localStorage.setItem('noteverse_saved', JSON.stringify(updated));
  };

  const handleLogin = (provider: 'google' | 'apple') => {
    const newUser: UserProfile = {
      name: provider === 'google' ? 'Utilizador Google' : 'Utilizador Apple',
      email:
        provider === 'google'
          ? 'utilizador@gmail.com'
          : 'utilizador@icloud.com',
      provider,
      isPro: false,
    };
    setUser(newUser);
    localStorage.setItem('noteverse_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('noteverse_user');
  };

  const handleExecutePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      const activeUser = user || {
        name: 'Utilizador Note Verse',
        email: 'utilizador@noteverse.app',
        provider: 'apple',
        isPro: true,
      };

      const proUser: UserProfile = {
        ...activeUser,
        isPro: true,
        planType: selectedPlan,
      };

      setUser(proUser);
      localStorage.setItem('noteverse_user', JSON.stringify(proUser));
      setShowCheckoutModal(false);
      setShowPlansModal(false);
      setShowPaywall(false);
      alert('Pagamento Aprovado! Plano PRO ativado instantaneamente.');
    }, 2000);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const isDark = theme === 'dark';
  const colors = {
    bgApp: isDark ? '#050914' : '#e2e8f0',
    bgFrame: isDark ? '#0b1325' : '#ffffff',
    borderFrame: isDark ? '#1e293b' : '#cbd5e1',
    headerBg: isDark ? '#0b1325' : '#ffffff',
    borderHeader: isDark ? '#1a243a' : '#f1f5f9',
    titleText: isDark ? '#38bdf8' : '#0f172a',
    subText: isDark ? '#64748b' : '#64748b',
    cardBg: isDark ? '#111a2e' : '#f8fafc',
    cardBorder: isDark ? '#1e2d4a' : '#e2e8f0',
    mainText: isDark ? '#e2e8f0' : '#0f172a',
    mutedText: isDark ? '#94a3b8' : '#64748b',
  };

  return (
    <div
      style={{ backgroundColor: colors.bgApp, color: colors.mainText }}
      className="min-h-screen flex items-center justify-center p-0 sm:p-4 font-sans transition-colors duration-300"
    >
      <div
        style={{
          backgroundColor: colors.bgFrame,
          borderColor: colors.borderFrame,
        }}
        className="w-full sm:max-w-[400px] h-screen sm:h-[840px] sm:rounded-[48px] sm:border-[8px] shadow-2xl flex flex-col justify-between relative overflow-hidden"
      >
        {/* Dynamic Island */}
        <div
          style={{ backgroundColor: '#000000' }}
          className="hidden sm:flex absolute top-0 left-1/2 transform -translate-x-1/2 w-36 h-6 rounded-b-2xl items-center justify-between px-3 z-50"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="text-[10px] text-slate-300 font-semibold">
            Note Verse
          </span>
          <ShieldCheck size={12} className="text-emerald-400" />
        </div>

        {/* Cabeçalho */}
        <header
          style={{
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.borderHeader,
          }}
          className="px-6 pt-10 sm:pt-10 pb-3 border-b"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1
                style={{ color: colors.titleText }}
                className="text-2xl font-black tracking-tight"
              >
                Note Verse
              </h1>
              <span
                style={{
                  backgroundColor: isDark ? '#132845' : '#e0f2fe',
                  color: '#0284c7',
                  borderColor: '#0284c7',
                }}
                className="text-[10px] border px-2 py-0.5 rounded-full font-bold"
              >
                {user?.isPro ? 'PRO' : 'FREE'}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAuthModal(true)}
                className="p-1.5 rounded-full bg-slate-800/40 text-cyan-400 hover:bg-slate-700/50 cursor-pointer"
              >
                <User size={18} />
              </button>
              <button
                onClick={() =>
                  setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
                }
                className="p-1.5 rounded-full cursor-pointer"
              >
                {isDark ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-indigo-600" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main
          style={{ backgroundColor: colors.bgFrame }}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        >
          {/* Estúdio de Entrada */}
          {activeTab !== 'saved' && (
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border p-4 rounded-2xl shadow-lg space-y-3"
            >
              <div
                style={{ color: colors.titleText }}
                className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Volume2 size={14} /> Estúdio de Entrada
                </span>
                {isRecording && (
                  <span className="text-red-400 font-mono text-xs font-bold animate-pulse">
                    {recordingTime}s / 60s
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-2.5">
                <button
                  onClick={handleToggleRecord}
                  style={{
                    backgroundColor: isRecording
                      ? 'rgba(239, 68, 68, 0.2)'
                      : isDark
                      ? '#231522'
                      : '#fef2f2',
                    color: '#f87171',
                    borderColor: isDark ? '#451a28' : '#fecaca',
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border shadow-sm cursor-pointer"
                >
                  {isRecording ? <Square size={14} /> : <Mic size={14} />}
                  <span>{isRecording ? 'Parar' : 'Gravar Voz'}</span>
                </button>

                <label
                  style={{
                    backgroundColor: isDark ? '#0f2b3c' : '#f0f9ff',
                    color: isDark ? '#38bdf8' : '#0284c7',
                    borderColor: isDark ? '#164e63' : '#bae6fd',
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs border cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-all hover:opacity-90"
                >
                  <Upload size={14} />
                  <span>Anexar Áudio</span>
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* BOTÃO GERAR COM PONTINHOS EM MOVIMENTO */}
              <button
                disabled={isProcessing}
                onClick={handleGenerateContent}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs rounded-xl shadow-md hover:opacity-90 flex items-center justify-center gap-1 transition-all disabled:opacity-75 cursor-pointer"
              >
                <span>Gerar</span>
                {isProcessing && (
                  <span className="inline-flex tracking-widest font-extrabold text-sm animate-pulse">
                    ...
                  </span>
                )}
              </button>
            </div>
          )}

          {/* ABA 1: Transcrição */}
          {activeTab === 'transcribe' && (
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border p-4 rounded-2xl shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">
                  Texto Transcrito
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => speakText(transcription)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                    title="Ouvir áudio"
                  >
                    <Volume2 size={14} />
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(transcription, 'transcription')
                    }
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                    title="Copiar texto"
                  >
                    {copiedSection === 'transcription' ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs leading-relaxed opacity-90 max-h-40 overflow-y-auto">
                {transcription}
              </p>
              <button
                onClick={handleOpenSaveModal}
                className="w-full mt-2 py-2 bg-slate-800 text-cyan-400 font-bold text-xs rounded-xl border border-cyan-500/30 hover:bg-slate-700 flex items-center justify-center gap-1.5"
              >
                <Bookmark size={14} /> Salvar Nota
              </button>
            </div>
          )}

          {/* ABA 2: Tradução */}
          {activeTab === 'translate' && (
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border p-4 rounded-2xl shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">
                  Tradução (EN)
                </span>
                <button
                  onClick={() => copyToClipboard(translation, 'translation')}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  {copiedSection === 'translation' ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
              <p className="text-xs leading-relaxed opacity-90 max-h-40 overflow-y-auto">
                {translation}
              </p>
            </div>
          )}

          {/* ABA 3: Resumo */}
          {activeTab === 'summary' && (
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border p-4 rounded-2xl shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">
                  Resumo Executivo
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(summary?.overview || '', 'summary')
                  }
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  {copiedSection === 'summary' ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {summary?.overview}
              </p>
              <div className="space-y-1 pt-2">
                <span className="text-[11px] font-bold text-slate-400">
                  Pontos Chave:
                </span>
                {summary?.keyPoints.map((point, index) => (
                  <div
                    key={index}
                    className="text-[11px] flex items-center gap-1.5 opacity-80"
                  >
                    <Sparkles size={10} className="text-cyan-400" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 4: Notas Salvas */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Folder size={14} /> Notas Salvas ({savedNotes.length})
                </span>
              </div>
              {savedNotes.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Nenhuma nota salva ainda.
                </div>
              ) : (
                savedNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    }}
                    className="border p-3 rounded-2xl shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{note.title}</span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-[11px] opacity-80 line-clamp-2">
                      {note.transcription}
                    </p>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>{note.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        {/* Rodapé / Navegação Única */}
        <footer
          style={{
            backgroundColor: colors.headerBg,
            borderTopColor: colors.borderHeader,
          }}
          className="px-6 py-3 border-t flex justify-around items-center"
        >
          <button
            onClick={() => setActiveTab('transcribe')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'transcribe'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Mic size={18} />
            <span className="text-[10px]">Transcrição</span>
          </button>
          <button
            onClick={() => setActiveTab('translate')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'translate'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Globe2 size={18} />
            <span className="text-[10px]">Tradução</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'summary'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Sparkles size={18} />
            <span className="text-[10px]">Resumo</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'saved'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Bookmark size={18} />
            <span className="text-[10px]">Salvos</span>
          </button>
        </footer>

        {/* MODAIS */}
        {showSaveModal && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border w-full max-w-xs p-5 rounded-2xl shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-bold text-cyan-400">Salvar Nota</h3>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">
                  Título da Nota
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Digite um título..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSaveNote}
                  className="flex-1 py-2 bg-cyan-500 text-black text-xs font-bold rounded-xl hover:bg-cyan-400 shadow-md"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {showAuthModal && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border w-full max-w-xs p-5 rounded-2xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-cyan-400">
                  Conta Note Verse
                </h3>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {user ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs font-bold text-white">{user.name}</p>
                    <p className="text-[10px] text-slate-400">{user.email}</p>
                    <span className="inline-block mt-1 text-[9px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full font-bold">
                      {user.isPro ? 'Plano PRO Ativo' : 'Plano FREE'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowAuthModal(false);
                      setShowPlansModal(true);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold rounded-xl shadow-md hover:opacity-90 flex items-center justify-center gap-1.5"
                  >
                    <Crown size={14} /> Ver Planos PRO
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowAuthModal(false);
                    }}
                    className="w-full py-2 bg-red-500/20 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/30 flex items-center justify-center gap-1.5"
                  >
                    <LogOut size={14} /> Terminar Sessão
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 text-center">
                    Inicie sessão para sincronizar suas notas e aceder a recursos avançados.
                  </p>
                  <button
                    onClick={() => {
                      handleLogin('google');
                      setShowAuthModal(false);
                    }}
                    className="w-full py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 flex items-center justify-center gap-2 border border-slate-700"
                  >
                    Continuar com Google
                  </button>
                  <button
                    onClick={() => {
                      handleLogin('apple');
                      setShowAuthModal(false);
                    }}
                    className="w-full py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 flex items-center justify-center gap-2 border border-slate-700"
                  >
                    Continuar com Apple
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showPlansModal && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border w-full max-w-xs p-5 rounded-2xl shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1">
                  <Crown size={14} /> Note Verse PRO
                </h3>
                <button
                  onClick={() => setShowPlansModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <div
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-3 rounded-xl border cursor-pointer ${
                    selectedPlan === 'monthly'
                      ? 'bg-cyan-500/10 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold">Mensal</p>
                  <p className="text-sm font-black text-cyan-400">R$ 29,90</p>
                </div>
                <div
                  onClick={() => setSelectedPlan('annual')}
                  className={`p-3 rounded-xl border cursor-pointer ${
                    selectedPlan === 'annual'
                      ? 'bg-cyan-500/10 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold">Anual (Melhor Valor)</p>
                  <p className="text-sm font-black text-cyan-400">R$ 214,80/ano</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPlansModal(false);
                  setShowCheckoutModal(true);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold rounded-xl shadow-md hover:opacity-90"
              >
                Assinar Agora
              </button>
            </div>
          </div>
        )}

        {showCheckoutModal && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border w-full max-w-xs p-5 rounded-2xl shadow-2xl space-y-3"
            >
              <h3 className="text-sm font-bold text-cyan-400">Pagamento</h3>
              <p className="text-xs text-slate-400">
                Escolha o método de pagamento para ativar o plano PRO instantaneamente.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                    paymentMethod === 'pix'
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  PIX
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                    paymentMethod === 'card'
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Cartão
                </button>
              </div>
              <button
                disabled={isProcessingPayment}
                onClick={handleExecutePayment}
                className="w-full py-2.5 bg-emerald-500 text-black text-xs font-bold rounded-xl shadow-md hover:bg-emerald-400 flex items-center justify-center gap-1.5"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    Processando...
                  </>
                ) : (
                  'Concluir Pagamento'
                )}
              </button>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-full py-1 text-slate-500 text-[11px] font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
