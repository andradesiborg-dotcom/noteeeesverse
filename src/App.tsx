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
  const [pixCopied, setPixCopied] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] =
    useState<boolean>(false);

  // Gravador e Áudio
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // Título Personalizado
  const [customTitle, setCustomTitle] = useState<string>('');

  // Conteúdo das Abas
  const [transcription, setTranscription] = useState<string>(
    'Esta é uma nota de exemplo. Grave a sua voz ou anexe um áudio para gerar transcrição, tradução e resumo.'
  );
  const [translation, setTranslation] = useState<string>(
    'This is an example note. Record your voice or upload an audio to generate transcription, translation, and summary.'
  );
  const [summary, setSummary] = useState<{
    overview: string;
    keyPoints: string[];
  } | null>({
    overview: 'Resumo executivo do conteúdo Note Verse.',
    keyPoints: [
      'Processamento 100% no dispositivo',
      'Suporte a salvamento com título e data exata',
    ],
  });
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Preço Dinâmico baseado no Plano
  const planPrices = {
    monthly: { total: '29,90', label: 'R$ 29,90 / mês' },
    quarterly: { total: '71,70', label: 'R$ 71,70 por trimestre' },
    annual: { total: '214,80', label: 'R$ 214,80 por ano (R$ 17,90/mês)' },
  };

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

  // Timer de Gravação (Trava em 60s se for FREE)
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
            setTranslation(`[Tradução Automática]: ${currentText.trim()}`);
            setSummary({
              overview: 'Síntese automática do áudio gravado.',
              keyPoints: ['Conteúdo capturado e processado localmente.'],
            });
            setCustomTitle(currentText.trim().slice(0, 30) + '...');
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      } else {
        setIsRecording(true);
        setTimeout(() => {
          const mockText =
            'Gravação de voz efetuada com sucesso no Note Verse.';
          setTranscription(mockText);
          setTranslation(`[Tradução Automática]: ${mockText}`);
          setSummary({
            overview: 'Resumo executivo gerado.',
            keyPoints: ['Áudio de voz registado.'],
          });
          setCustomTitle('Gravação de Voz');
          setIsRecording(false);
        }, 3000);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setIsProcessing(true);
      setProcessingStatus('A processar ficheiro...');

      setTimeout(() => {
        const fileText = `Ficheiro "${file.name}" processado com sucesso. Note Verse pronto.`;
        setTranscription(fileText);
        setTranslation(`[Tradução Automática]: ${fileText}`);
        setSummary({
          overview: `Resumo do ficheiro: ${file.name}`,
          keyPoints: ['Áudio importado externamente'],
        });
        setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
        setIsProcessing(false);
      }, 1500);
    }
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

  // Processar Compra Instantânea
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
      {/* Moldura do iPhone */}
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
          {activeTab !== 'saved' ? (
            <>
              {/* Estúdio de Entrada */}
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
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {isProcessing && (
                  <div
                    style={{ color: colors.titleText }}
                    className="flex items-center justify-center gap-2 pt-2 text-xs font-semibold"
                  >
                    <RefreshCw className="animate-spin" size={14} />
                    <span>{processingStatus}</span>
                  </div>
                )}

                {audioUrl && !isProcessing && (
                  <audio
                    src={audioUrl}
                    controls
                    className="w-full h-8 mt-1 rounded-lg opacity-90"
                  />
                )}
              </div>

              {/* Display de Transcrição / Tradução / Resumo + BOTÃO SALVAR */}
              <div
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                }}
                className="border p-4 rounded-2xl shadow-lg min-h-[260px] flex flex-col justify-between"
              >
                <div>
                  <div
                    style={{ borderBottomColor: colors.borderHeader }}
                    className="flex items-center justify-between pb-2 border-b mb-3"
                  >
                    <span
                      style={{ color: colors.mutedText }}
                      className="text-[11px] font-bold uppercase tracking-wider"
                    >
                      {activeTab === 'transcribe' && 'TRANSCRIÇÃO NATIVA'}
                      {activeTab === 'translate' && 'TRADUÇÃO OFFLINE'}
                      {activeTab === 'summary' && 'RESUMO INTELIGENTE'}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          speakText(
                            activeTab === 'transcribe'
                              ? transcription
                              : activeTab === 'translate'
                              ? translation
                              : summary?.overview || ''
                          )
                        }
                        title="Ouvir em Voz Alta"
                        className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      >
                        <Volume2 size={16} />
                      </button>
                      <button
                        onClick={() => copyToClipboard(transcription, 't')}
                        title="Copiar texto"
                        className="text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {copiedSection === 't' ? (
                          <Check size={16} className="text-emerald-400" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center items-center text-center py-2">
                    {activeTab === 'transcribe' && (
                      <p className="text-xs text-left w-full font-medium leading-relaxed">
                        {transcription}
                      </p>
                    )}
                    {activeTab === 'translate' && (
                      <p className="text-xs text-left w-full font-medium leading-relaxed">
                        {translation}
                      </p>
                    )}
                    {activeTab === 'summary' && summary && (
                      <div className="text-xs text-left w-full space-y-2">
                        <p className="font-bold text-cyan-400">
                          {summary.overview}
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                          {summary.keyPoints.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTÃO SALVAR */}
                <div className="pt-3 border-t border-slate-800/40 mt-3">
                  <button
                    onClick={handleOpenSaveModal}
                    style={{ backgroundColor: '#0284c7', color: '#ffffff' }}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:bg-sky-600"
                  >
                    <Bookmark size={16} />
                    <span>Salvar</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ABA DE ARQUIVOS SALVOS */
            <div className="space-y-3">
              <h2
                style={{ color: colors.titleText }}
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <Folder size={16} /> Arquivos Guardados ({savedNotes.length})
              </h2>

              {savedNotes.length === 0 ? (
                <div
                  className="text-center py-12"
                  style={{ color: colors.mutedText }}
                >
                  <Folder size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">
                    Nenhuma nota guardada ainda.
                  </p>
                  <p className="text-[11px] opacity-70 mt-1">
                    Grave ou anexe um áudio e clique em "Salvar".
                  </p>
                </div>
              ) : (
                savedNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    }}
                    className="border p-3.5 rounded-xl space-y-2 relative shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-cyan-400 font-bold">
                        {note.date}
                      </span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-white">{note.title}</p>
                    <p className="text-[11px] text-slate-300 line-clamp-2">
                      {note.transcription}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        {/* MODAL CHECKOUT DE PAGAMENTO RÁPIDO (APPLE PAY / PIX / CARTÃO) */}
        {showCheckoutModal && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-5">
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border p-5 rounded-3xl space-y-4 max-w-xs shadow-2xl w-full"
            >
              <div className="text-center space-y-1">
                <Lock size={28} className="text-cyan-400 mx-auto" />
                <h3 className="text-base font-black text-white">
                  Checkout Seguro
                </h3>
                <p className="text-[11px] text-amber-400 font-bold uppercase">
                  Total: R$ {planPrices[selectedPlan].total}
                </p>
              </div>

              {/* SELETOR DE MÉTODOS DE PAGAMENTO */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('applepay')}
                  className={`py-2 px-1 rounded-xl border text-center flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition-all ${
                    paymentMethod === 'applepay'
                      ? 'border-white bg-white text-black'
                      : 'border-slate-800 text-slate-400 bg-slate-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.82.13-9.74-1.98-14.74-6.35-3.23-2.76-7.16-7.46-11.8-14.1-6.8-9.72-12.08-20.73-15.86-33.02-3.77-12.29-5.66-24.16-5.66-35.6 0-15.35 4.02-28.01 12.07-37.97 8.05-9.97 18.06-15.02 30.04-15.17 4.71 0 9.87 1.18 15.48 3.55 5.61 2.37 9.4 3.56 11.37 3.56 1.73 0 5.61-1.25 11.64-3.75 6.03-2.5 11.13-3.62 15.31-3.35 11.33.82 20.81 4.97 28.44 12.44-10.1 6.13-15.05 14.8-14.86 26.01.19 8.8 3.49 16.14 9.9 22.02 6.41 5.88 14.15 9.25 23.23 10.1-2.27 6.88-5.3 14.07-9.09 21.57zM119.22 31.08c0-6.85 2.45-13.39 7.36-19.63 4.91-6.24 11.12-10.3 18.63-12.18.3 1.15.45 2.22.45 3.2 0 6.94-2.55 13.59-7.66 19.95-5.1 6.36-11.33 10.31-18.68 11.85-.05-1.07-.1-2.14-.1-3.19z" />
                  </svg>
                  <span>Apple Pay</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`py-2 px-1 rounded-xl border text-center flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition-all ${
                    paymentMethod === 'pix'
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400'
                      : 'border-slate-800 text-slate-400 bg-slate-900/50'
                  }`}
                >
                  <QrCode size={16} />
                  <span>Pix</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-1 rounded-xl border text-center flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-800 text-slate-400 bg-slate-900/50'
                  }`}
                >
                  <CreditCard size={16} />
                  <span>Cartão</span>
                </button>
              </div>

              {/* OPÇÃO APPLE PAY */}
              {paymentMethod === 'applepay' && (
                <div className="space-y-3 text-center pt-2">
                  <p className="text-[11px] text-slate-300">
                    Pague num toque utilizando o Touch ID ou Face ID do seu
                    iPhone.
                  </p>
                  <button
                    onClick={handleExecutePayment}
                    disabled={isProcessingPayment}
                    className="w-full py-3 bg-white text-black font-extrabold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100"
                  >
                    {isProcessingPayment ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 170 170"
                        >
                          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.82.13-9.74-1.98-14.74-6.35-3.23-2.76-7.16-7.46-11.8-14.1-6.8-9.72-12.08-20.73-15.86-33.02-3.77-12.29-5.66-24.16-5.66-35.6 0-15.35 4.02-28.01 12.07-37.97 8.05-9.97 18.06-15.02 30.04-15.17 4.71 0 9.87 1.18 15.48 3.55 5.61 2.37 9.4 3.56 11.37 3.56 1.73 0 5.61-1.25 11.64-3.75 6.03-2.5 11.13-3.62 15.31-3.35 11.33.82 20.81 4.97 28.44 12.44-10.1 6.13-15.05 14.8-14.86 26.01.19 8.8 3.49 16.14 9.9 22.02 6.41 5.88 14.15 9.25 23.23 10.1-2.27 6.88-5.3 14.07-9.09 21.57zM119.22 31.08c0-6.85 2.45-13.39 7.36-19.63 4.91-6.24 11.12-10.3 18.63-12.18.3 1.15.45 2.22.45 3.2 0 6.94-2.55 13.59-7.66 19.95-5.1 6.36-11.33 10.31-18.68 11.85-.05-1.07-.1-2.14-.1-3.19z" />
                        </svg>
                        <span>Pagar com Apple Pay</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* OPÇÃO PIX */}
              {paymentMethod === 'pix' && (
                <div className="space-y-3 text-center pt-2">
                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-2">
                    <p className="text-[10px] text-slate-400">
                      Código Pix Copia e Cola:
                    </p>
                    <p className="font-mono text-[9px] text-emerald-400 break-all bg-black/40 p-2 rounded border border-emerald-500/30">
                      00020126580014BR.GOV.BCB.PIX0136noteverse-pay-021020265204000053039865405
                      {planPrices[selectedPlan].total}5802BR
                    </p>
                    <button
                      onClick={() => {
                        setPixCopied(true);
                        setTimeout(() => setPixCopied(false), 2000);
                      }}
                      className="w-full py-1.5 bg-emerald-500/20 text-emerald-400 font-bold text-[10px] rounded border border-emerald-500/40 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {pixCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>
                        {pixCopied ? 'Código Copiado!' : 'Copiar Código Pix'}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={handleExecutePayment}
                    disabled={isProcessingPayment}
                    className="w-full py-2.5 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg cursor-pointer hover:bg-emerald-400"
                  >
                    {isProcessingPayment
                      ? 'A confirmar Pix...'
                      : 'Já fiz o pagamento via Pix'}
                  </button>
                </div>
              )}

              {/* OPÇÃO CARTÃO DE CRÉDITO */}
              {paymentMethod === 'card' && (
                <div className="space-y-2 pt-2 text-left">
                  <input
                    type="text"
                    placeholder="Número do Cartão"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/AA"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="CVC"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleExecutePayment}
                    disabled={isProcessingPayment}
                    className="w-full py-2.5 bg-cyan-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg cursor-pointer hover:bg-cyan-400 mt-2"
                  >
                    {isProcessingPayment
                      ? 'A processar...'
                      : 'Pagar R$ ' + planPrices[selectedPlan].total}
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-[11px] text-slate-400 underline block mx-auto py-1 cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        {/* MODAL DE PLANOS */}
        {showPlansModal && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-5">
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border p-5 rounded-3xl space-y-4 max-w-xs shadow-2xl w-full max-h-[92vh] overflow-y-auto"
            >
              <div className="text-center space-y-1">
                <Crown
                  size={32}
                  className="text-amber-400 mx-auto animate-bounce"
                />
                <h3 className="text-base font-black text-white">
                  Escolha o seu Plano PRO
                </h3>
                <p className="text-[11px] text-slate-400">
                  Gravações e transcrições ilimitadas com total privacidade.
                </p>
              </div>

              {/* PLANO MENSAL */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Plano Mensal
                  </span>
                  {selectedPlan === 'monthly' && (
                    <CheckCircle2 size={16} className="text-amber-400" />
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-amber-400">
                    R$ 29,90
                  </span>
                  <span className="text-[10px] text-slate-400">/mês</span>
                </div>
              </div>

              {/* PLANO TRIMESTRAL */}
              <div
                onClick={() => setSelectedPlan('quarterly')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all relative ${
                  selectedPlan === 'quarterly'
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <span className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full">
                  20% OFF
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Plano Trimestral
                  </span>
                  {selectedPlan === 'quarterly' && (
                    <CheckCircle2 size={16} className="text-amber-400" />
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-amber-400">
                    R$ 23,90
                  </span>
                  <span className="text-[10px] text-slate-400">/mês</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Cobrado R$ 71,70 a cada 3 meses
                </p>
              </div>

              {/* PLANO ANUAL */}
              <div
                onClick={() => setSelectedPlan('annual')}
                className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all relative ${
                  selectedPlan === 'annual'
                    ? 'border-amber-400 bg-amber-500/15'
                    : 'border-slate-700 bg-slate-900/60'
                }`}
              >
                <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-[9px] px-2 py-0.5 rounded-full shadow-md">
                  40% OFF • MAIS POPULAR
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">
                    Plano Anual
                  </span>
                  {selectedPlan === 'annual' && (
                    <CheckCircle2 size={16} className="text-amber-400" />
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-black text-amber-400">
                    R$ 17,90
                  </span>
                  <span className="text-[10px] text-slate-400">/mês</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Cobrado R$ 214,80 por ano
                </p>
              </div>

              <button
                onClick={() => setShowCheckoutModal(true)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer hover:opacity-90"
              >
                Ir para o Pagamento
              </button>

              <button
                onClick={() => setShowPlansModal(false)}
                className="text-[11px] text-slate-400 underline block mx-auto py-1 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* MODAL PARA TÍTULO E SALVAMENTO */}
        {showSaveModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border p-6 rounded-3xl text-center space-y-4 max-w-xs shadow-2xl w-full"
            >
              <div className="w-12 h-12 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                <Edit3 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Guardar Documento
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Dê um título personalizado. A data e hora exatas serão
                  registadas.
                </p>
              </div>

              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ex: Reunião de Projeto"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
              />

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleConfirmSaveNote}
                  className="w-full py-2.5 bg-cyan-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg hover:bg-cyan-400 transition-colors cursor-pointer"
                >
                  Confirmar e Salvar
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="text-[11px] text-slate-400 underline block mx-auto py-1 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE LOGIN / PERFIL / SUPORTE */}
        {showAuthModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border p-6 rounded-3xl text-center space-y-4 max-w-xs shadow-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <User size={24} />
              </div>

              {user ? (
                <div className="space-y-4 text-left">
                  <h3 className="text-base font-bold text-white text-center">
                    Sua Conta
                  </h3>

                  <div className="p-3 bg-slate-800/50 rounded-xl text-xs space-y-1.5 border border-slate-700">
                    <p className="font-semibold text-slate-200">{user.name}</p>
                    <p className="text-slate-400 text-[11px]">{user.email}</p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">Plano:</span>
                      <span className="text-cyan-400 font-bold text-[10px] uppercase">
                        {user.isPro
                          ? `PRO (${
                              user.planType === 'annual'
                                ? 'Anual'
                                : user.planType === 'quarterly'
                                ? 'Trimestral'
                                : 'Mensal'
                            })`
                          : 'Gratuito (1 min)'}
                      </span>
                    </div>
                  </div>

                  {!user.isPro && (
                    <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl space-y-2 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs">
                        <Crown size={14} />
                        <span>Desbloqueie o Note Verse PRO</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowAuthModal(false);
                          setShowPlansModal(true);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs rounded-lg shadow-md cursor-pointer hover:opacity-90"
                      >
                        Ver Planos e Descontos
                      </button>
                    </div>
                  )}

                  <div className="p-3 bg-slate-800/30 border border-slate-700/60 rounded-xl space-y-2 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-cyan-400 font-bold text-xs">
                      <HelpCircle size={14} />
                      <span>Precisa de Ajuda?</span>
                    </div>
                    <a
                      href="mailto:suportnoteverse@gmail.com?subject=Suporte%20Note%20Verse"
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg border border-slate-600 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Mail size={14} />
                      <span>suportnoteverse@gmail.com</span>
                    </a>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 bg-red-500/20 text-red-400 font-bold text-xs rounded-xl border border-red-500/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut size={14} /> Terminar Sessão
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Entrar no Note Verse
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Sincronize as suas notas e aceda no iPhone ou Web.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      onClick={() => handleLogin('google')}
                      className="w-full py-2.5 bg-white text-slate-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-slate-100 cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continuar com Google</span>
                    </button>

                    <button
                      onClick={() => handleLogin('apple')}
                      className="w-full py-2.5 bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 shadow-md hover:bg-slate-900 cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4 fill-current"
                        viewBox="0 0 170 170"
                      >
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.82.13-9.74-1.98-14.74-6.35-3.23-2.76-7.16-7.46-11.8-14.1-6.8-9.72-12.08-20.73-15.86-33.02-3.77-12.29-5.66-24.16-5.66-35.6 0-15.35 4.02-28.01 12.07-37.97 8.05-9.97 18.06-15.02 30.04-15.17 4.71 0 9.87 1.18 15.48 3.55 5.61 2.37 9.4 3.56 11.37 3.56 1.73 0 5.61-1.25 11.64-3.75 6.03-2.5 11.13-3.62 15.31-3.35 11.33.82 20.81 4.97 28.44 12.44-10.1 6.13-15.05 14.8-14.86 26.01.19 8.8 3.49 16.14 9.9 22.02 6.41 5.88 14.15 9.25 23.23 10.1-2.27 6.88-5.3 14.07-9.09 21.57zM119.22 31.08c0-6.85 2.45-13.39 7.36-19.63 4.91-6.24 11.12-10.3 18.63-12.18.3 1.15.45 2.22.45 3.2 0 6.94-2.55 13.59-7.66 19.95-5.1 6.36-11.33 10.31-18.68 11.85-.05-1.07-.1-2.14-.1-3.19z" />
                      </svg>
                      <span>Continuar com Apple</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowAuthModal(false)}
                className="text-[11px] text-slate-400 underline block mx-auto pt-2 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Modal Paywall */}
        {showPaywall && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border p-5 rounded-2xl text-center space-y-4 max-w-xs shadow-2xl"
            >
              <Crown
                size={40}
                className="text-amber-400 mx-auto animate-bounce"
              />
              <h3 className="text-lg font-black text-white">
                Atingiu o limite de 1 Minuto
              </h3>
              <p className="text-xs text-slate-300">
                O plano gratuito permite gravações de até 60 segundos. Adquira o
                plano <strong>PRO</strong> para gravações ilimitadas!
              </p>
              <button
                onClick={() => {
                  setShowPaywall(false);
                  setShowPlansModal(true);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Ver Planos e Descontos
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="text-[11px] text-slate-400 underline block mx-auto cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Navegação Inferior */}
        <nav
          style={{
            backgroundColor: colors.headerBg,
            borderTopColor: colors.borderHeader,
          }}
          className="border-t px-2 py-3 flex justify-around items-center"
        >
          <button
            onClick={() => setActiveTab('transcribe')}
            style={{
              color: activeTab === 'transcribe' ? '#38bdf8' : colors.mutedText,
            }}
            className="flex flex-col items-center gap-1 font-bold cursor-pointer"
          >
            <FileAudio size={18} />
            <span className="text-[9px]">Transcrição</span>
          </button>

          <button
            onClick={() => setActiveTab('translate')}
            style={{
              color: activeTab === 'translate' ? '#38bdf8' : colors.mutedText,
            }}
            className="flex flex-col items-center gap-1 font-bold cursor-pointer"
          >
            <Globe2 size={18} />
            <span className="text-[9px]">Tradução</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            style={{
              color: activeTab === 'summary' ? '#38bdf8' : colors.mutedText,
            }}
            className="flex flex-col items-center gap-1 font-bold cursor-pointer"
          >
            <Sparkles size={18} />
            <span className="text-[9px]">Resumo</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            style={{
              color: activeTab === 'saved' ? '#38bdf8' : colors.mutedText,
            }}
            className="flex flex-col items-center gap-1 font-bold cursor-pointer"
          >
            <Folder size={18} />
            <span className="text-[9px]">Guardados</span>
          </button>
        </nav>

        {/* Home Bar do iPhone */}
        <div
          style={{ backgroundColor: colors.headerBg }}
          className="h-3 flex items-center justify-center pb-1"
        >
          <div
            style={{ backgroundColor: colors.mutedText }}
            className="w-28 h-1 rounded-full opacity-40"
          ></div>
        </div>
      </div>
    </div>
  );
}
