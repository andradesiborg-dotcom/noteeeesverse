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
      // Validação estrita: aceita apenas ficheiros de áudio reais ou extensões compatíveis
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
      setIsProcessing(true);
      setProcessingStatus('A processar ficheiro de áudio...');

      setTimeout(() => {
        const fileText = `Ficheiro de áudio "${file.name}" processado com sucesso. Note Verse pronto.`;
        setTranscription(fileText);
        setTranslation(`[Tradução Automática]: ${fileText}`);
        setSummary({
          overview: `Resumo do áudio: ${file.name}`,
          keyPoints: ['Áudio importado externamente e validado'],
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
                      accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm"
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
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
