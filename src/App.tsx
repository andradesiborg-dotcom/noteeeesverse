import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
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
  ChevronDown,
  X,
  CreditCard,
} from 'lucide-react';

interface SavedNote {
  id: string;
  title: string;
  date: string;
  transcription?: string;
  translation?: string;
  summaryOverview?: string;
  durationSeconds: number;
}

interface UserProfile {
  name: string;
  email: string;
  provider: 'google' | 'apple' | 'email';
  isPro: boolean;
  avatarUrl?: string;
}

const LANGUAGES = [
  { code: 'pt', name: 'Português (PT/BR)' },
  { code: 'en', name: 'Inglês (US/UK)' },
  { code: 'es', name: 'Espanhol' },
  { code: 'fr', name: 'Francês' },
  { code: 'de', name: 'Alemão' },
  { code: 'it', name: 'Italiano' },
  { code: 'zh-CN', name: 'Mandarim' },
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<
    'transcribe' | 'translate' | 'summary' | 'saved' | 'pro'
  >('transcribe');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Modais e Autenticação
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authName, setAuthName] = useState<string>('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Deteção se o utilizador está no Brasil (para liberar o Pix)
  const [isBrazilUser, setIsBrazilUser] = useState<boolean>(false);

  // Seleção de itens a guardar na Nota
  const [saveOptions, setSaveOptions] = useState<{
    transcription: boolean;
    translation: boolean;
    summary: boolean;
  }>({
    transcription: true,
    translation: true,
    summary: true,
  });

  // Idioma de Tradução
  const [targetLanguage, setTargetLanguage] = useState<string>('en');

  // Gravador e Áudio
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(10);
  const [capturedText, setCapturedText] = useState<string>('');

  // Título e Conteúdos
  const [customTitle, setCustomTitle] = useState<string>('');
  const [transcription, setTranscription] = useState<string>(
    'Grave um áudio ou anexe um ficheiro e clique em "Gerar" para ver a transcrição, tradução e resumo.'
  );
  const [translation, setTranslation] = useState<string>(
    'Record an audio or upload a file and click "Generate" to see transcription, translation, and summary.'
  );
  const [summary, setSummary] = useState<string>(
    'Resumo executivo do conteúdo Note Verse.'
  );
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Inicialização e Deteção de Região (Idioma/Local)
  useEffect(() => {
    const deviceLang = navigator.language || (navigator as any).userLanguage || 'pt';
    const langCode = deviceLang.split('-')[0].toLowerCase();

    if (deviceLang.toLowerCase().includes('br') || deviceLang.toLowerCase().includes('pt-br')) {
      setIsBrazilUser(true);
    }

    const matchedLang = LANGUAGES.find((l) => l.code === langCode);
    if (matchedLang) {
      setTargetLanguage(matchedLang.code);
    } else {
      setTargetLanguage('en');
    }

    const localNotes = localStorage.getItem('noteverse_saved');
    if (localNotes) {
      try {
        setSavedNotes(JSON.parse(localNotes));
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
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const handleLoginWithProvider = (provider: 'google' | 'apple') => {
    const mockUser: UserProfile = {
      name: provider === 'google' ? 'Utilizador Google' : 'Utilizador Apple',
      email: provider === 'google' ? 'utilizador@gmail.com' : 'utilizador@icloud.com',
      provider,
      isPro: false,
      avatarUrl: provider === 'google' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
        : undefined
    };
    setUser(mockUser);
    localStorage.setItem('noteverse_user', JSON.stringify(mockUser));
    setShowAuthModal(false);
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      alert('Por favor, preencha o e-mail e a palavra-passe.');
      return;
    }
    const loggedUser: UserProfile = {
      name: authName || authEmail.split('@')[0],
      email: authEmail,
      provider: 'email',
      isPro: false,
    };
    setUser(loggedUser);
    localStorage.setItem('noteverse_user', JSON.stringify(loggedUser));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('noteverse_user');
  };

  // REDIRECIONAMENTO PARA CHECKOUT (Stripe ou Mercado Pago)
  const handleCheckout = (paymentMethod: 'card' | 'pix' | 'applepay') => {
    if (!user) {
      alert('Faça login primeiro para assinar o plano PRO!');
      setShowAuthModal(true);
      setShowPaymentModal(false);
      return;
    }

    let checkoutUrl = 'https://buy.stripe.com/seu_link_stripe_global'; 

    if (paymentMethod === 'pix' && isBrazilUser) {
      checkoutUrl = 'https://link.mercadopago.com.br/seu_link_pix_brasil';
    }

    window.open(checkoutUrl, '_blank');
    setShowPaymentModal(false);
  };

  const stopAudioAnalysis = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setAudioLevel(Math.max(15, Math.min(100, average * 1.5)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.warn('Microfone não acessível.', e);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      stopAudioAnalysis();
      setIsRecording(false);
    } else {
      if (capturedText || audioUrl) {
        setAudioUrl(null);
        setCapturedText('');
      }
      setRecordingTime(0);
      startAudioAnalysis();

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = navigator.language || 'pt-PT';

        recognition.onresult = (event: any) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript + ' ';
          }
          if (currentText.trim()) {
            setCapturedText(currentText.trim());
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      } else {
        setIsRecording(true);
        setTimeout(() => {
          setCapturedText('Gravação de voz efetuada com sucesso no Note Verse.');
        }, 1500);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (isRecording) {
        if (recognitionRef.current) recognitionRef.current.stop();
        stopAudioAnalysis();
        setIsRecording(false);
      }
      setCapturedText('');
      setAudioUrl(url);
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
      setTranscription(`Ficheiro "${file.name}" carregado. Clique em "Gerar" para processar.`);
    }
  };

  const translateTextReal = async (text: string, targetLang: string) => {
    if (!text || text.startsWith('Grave um áudio')) return text;
    setIsTranslating(true);
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
          text
        )}`
      );
      const data = await res.json();
      if (data && data[0]) {
        const translatedResult = data[0].map((item: any) => item[0]).join('');
        setIsTranslating(false);
        return translatedResult;
      }
    } catch (e) {
      console.error('Erro na tradução real:', e);
    }
    setIsTranslating(false);
    return text;
  };

  const generateCleanSummary = (text: string) => {
    const cleanText = text.trim();
    const sentences = cleanText
      .split(/(?<=[.?!])\s+/)
      .filter((s) => s.length > 0);

    const firstSentence = sentences[0] || cleanText;
    const middleSentence = sentences[Math.floor(sentences.length / 2)] || '';
    const lastSentence = sentences[sentences.length - 1] || '';

    let overviewText = `O relato descreve que ${firstSentence.toLowerCase()}`;
    if (sentences.length > 1 && middleSentence !== firstSentence) {
      overviewText += `, desdobrando-se em "${middleSentence}"`;
    }
    if (sentences.length > 2 && lastSentence !== middleSentence) {
      overviewText += ` e concluindo com "${lastSentence}".`;
    } else {
      overviewText += '.';
    }

    return overviewText;
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setTargetLanguage(selected);

    const currentSource = capturedText.trim() || transcription;
    if (currentSource && !currentSource.startsWith('Grave um áudio')) {
      const translated = await translateTextReal(currentSource, selected);
      setTranslation(translated);
    }
  };

  const handleGenerateContent = async () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      stopAudioAnalysis();
      setIsRecording(false);
    }

    if (!audioUrl && !capturedText) {
      alert('Grave um áudio ou anexe um ficheiro antes de gerar.');
      return;
    }

    setIsProcessing(true);

    const baseText = capturedText.trim() || 'Áudio gravado com sucesso no Note Verse.';

    setTranscription(baseText);
    setSummary(generateCleanSummary(baseText));

    if (!customTitle) {
      setCustomTitle(baseText.slice(0, 25) + '...');
    }

    const translatedText = await translateTextReal(baseText, targetLanguage);
    setTranslation(translatedText);

    setIsProcessing(false);
  };

  const handleOpenSaveModal = () => {
    if (!transcription || transcription.startsWith('Grave um áudio')) return;
    if (!customTitle) setCustomTitle(transcription.slice(0, 25) + '...');
    setShowSaveModal(true);
  };

  const handleConfirmSaveNote = () => {
    if (!saveOptions.transcription && !saveOptions.translation && !saveOptions.summary) {
      alert('Selecione pelo menos um item para salvar!');
      return;
    }

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
      transcription: saveOptions.transcription ? transcription : undefined,
      translation: saveOptions.translation ? translation : undefined,
      summaryOverview: saveOptions.summary ? summary : undefined,
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

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLanguage;
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
    cardBg: isDark ? '#111a2e' : '#f8fafc',
    cardBorder: isDark ? '#1e2d4a' : '#e2e8f0',
    mainText: isDark ? '#e2e8f0' : '#0f172a',
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
              <button
                onClick={() => setShowPaymentModal(true)}
                className="cursor-pointer"
                title="Clique para assinar o PRO"
              >
                <span
                  style={{
                    backgroundColor: user?.isPro ? '#0284c7' : (isDark ? '#132845' : '#e0f2fe'),
                    color: user?.isPro ? '#ffffff' : '#0284c7',
                    borderColor: '#0284c7',
                  }}
                  className="text-[10px] border px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm hover:opacity-80"
                >
                  <Crown size={10} /> {user?.isPro ? 'PRO' : 'ASSINAR PRO'}
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {user ? (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 p-1 px-2 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-700 cursor-pointer"
                >
                  <User size={14} />
                  <span className="text-[10px] font-bold max-w-[60px] truncate">
                    {user.name}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="p-1.5 rounded-full bg-slate-800/40 text-cyan-400 hover:bg-slate-700/50 cursor-pointer"
                >
                  <User size={18} />
                </button>
              )}

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
          {activeTab !== 'saved' && activeTab !== 'pro' && (
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
                    {recordingTime}s
                  </span>
                )}
              </div>

              {/* Gravador ou Ficheiro */}
              {isRecording ? (
                <div className="flex flex-col items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <span className="text-xs text-red-400 font-bold">A gravar voz...</span>
                  <div className="flex items-center gap-1.5 h-8">
                    {[0.6, 1, 0.4, 0.8, 1.2, 0.7, 0.5, 0.9, 0.3].map((factor, idx) => (
                      <div
                        key={idx}
                        className="w-1.5 bg-red-400 rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.min(32, Math.max(6, audioLevel * factor))}px`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2.5">
                  <button
                    onClick={handleToggleRecord}
                    style={{
                      backgroundColor: isDark ? '#231522' : '#fef2f2',
                      color: '#f87171',
                      borderColor: isDark ? '#451a28' : '#fecaca',
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border shadow-sm cursor-pointer"
                  >
                    <Mic size={14} />
                    <span>Gravar Voz</span>
                  </button>

                  <label
                    style={{
                      backgroundColor: isDark ? '#0f2b3c' : '#f0f9ff',
                      color: isDark ? '#38bdf8' : '#0284c7',
                      borderColor: isDark ? '#164e63' : '#bae6fd',
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs border cursor-pointer flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90"
                  >
                    <Upload size={14} />
                    <span>Anexar Áudio</span>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {isRecording && (
                <button
                  onClick={handleToggleRecord}
                  className="w-full py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/30 hover:bg-red-500/30 cursor-pointer"
                >
                  Pausar Gravação
                </button>
              )}

              {!isRecording && capturedText && (
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 space-y-1">
                  <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                    <Mic size={12} /> Prévia Capturada:
                  </p>
                  <p className="text-xs text-slate-200 line-clamp-2">{capturedText}</p>
                </div>
              )}

              {/* Botão Gerar */}
              <button
                disabled={isProcessing || (!capturedText && !audioUrl)}
                onClick={handleGenerateContent}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs rounded-xl shadow-md hover:opacity-90 flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                <span className="text-xs font-bold text-cyan-400">Texto Transcrito</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => speakText(transcription)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                    title="Ouvir áudio"
                  >
                    <Volume2 size={14} />
                  </button>
                  <button
                    onClick={() => copyToClipboard(transcription, 'transcription')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
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
                disabled={transcription.startsWith('Grave um áudio')}
                onClick={handleOpenSaveModal}
                className="w-full mt-2 py-2 bg-slate-800 text-cyan-400 font-bold text-xs rounded-xl border border-cyan-500/30 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
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
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-700">
                  <Globe2 size={13} className="text-cyan-400" />
                  <select
                    value={targetLanguage}
                    onChange={handleLanguageChange}
                    className="bg-transparent text-xs text-cyan-400 font-bold focus:outline-none cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => speakText(translation)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                    title="Ouvir tradução"
                  >
                    <Volume2 size={14} />
                  </button>
                  <button
                    onClick={() => copyToClipboard(translation, 'translation')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                    title="Copiar tradução"
                  >
                    {copiedSection === 'translation' ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>

              {isTranslating ? (
                <div className="text-xs text-cyan-400 font-bold animate-pulse py-2">
                  A traduzir texto...
                </div>
              ) : (
                <p className="text-xs leading-relaxed opacity-90 max-h-40 overflow-y-auto">
                  {translation}
                </p>
              )}
              <button
                disabled={translation.startsWith('Record an audio')}
                onClick={handleOpenSaveModal}
                className="w-full mt-2 py-2 bg-slate-800 text-cyan-400 font-bold text-xs rounded-xl border border-cyan-500/30 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bookmark size={14} /> Salvar Nota
              </button>
            </div>
          )}

          {/* ABA 3: Resumo Direto */}
          {activeTab === 'summary' && (
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border p-4 rounded-2xl shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">Resumo Executivo</span>
                <button
                  onClick={() => copyToClipboard(summary, 'summary')}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  title="Copiar resumo"
                >
                  {copiedSection === 'summary' ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
              <p className="text-xs leading-relaxed opacity-90 font-medium">
                {summary}
              </p>
              <button
                disabled={summary.startsWith('Resumo executivo')}
                onClick={handleOpenSaveModal}
                className="w-full mt-2 py-2 bg-slate-800 text-cyan-400 font-bold text-xs rounded-xl border border-cyan-500/30 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bookmark size={14} /> Salvar Nota
              </button>
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
                    className="border p-3.5 rounded-2xl shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400">{note.title}</span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {note.transcription && (
                      <div className="bg-slate-900/50 p-2 rounded-xl space-y-0.5 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold">Transcrição:</span>
                        <p className="text-[11px] opacity-80 line-clamp-2">{note.transcription}</p>
                      </div>
                    )}

                    {note.translation && (
                      <div className="bg-slate-900/50 p-2 rounded-xl space-y-0.5 border border-slate-800">
                        <span className="text-[10px] text-cyan-400 font-bold">Tradução:</span>
                        <p className="text-[11px] opacity-80 line-clamp-2">{note.translation}</p>
                      </div>
                    )}

                    {note.summaryOverview && (
                      <div className="bg-slate-900/50 p-2 rounded-xl space-y-0.5 border border-slate-800">
                        <span className="text-[10px] text-emerald-400 font-bold">Resumo:</span>
                        <p className="text-[11px] opacity-80 line-clamp-2">{note.summaryOverview}</p>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 pt-1 flex justify-between">
                      <span>{note.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ABA 5: PLANO PRO (Sempre visível no menu inferior) */}
          {activeTab === 'pro' && (
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border p-5 rounded-2xl shadow-lg space-y-4 text-center"
            >
              <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-full mx-auto flex items-center justify-center border border-cyan-500/30">
                <Crown size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-cyan-400">Note Verse PRO</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Desbloqueie traduções avançadas sem limite, resumos inteligentes automáticos e armazenamento expandido. Sem mensalidades fixas.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleCheckout('card')}
                  className="w-full py-3 bg-slate-800 text-white border border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 cursor-pointer shadow-sm"
                >
                  <CreditCard size={16} className="text-cyan-400" />
                  <span>Pagar com Cartão de Crédito</span>
                </button>

                <button
                  onClick={() => handleCheckout('applepay')}
                  className="w-full py-3 bg-black text-white border border-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.31c.65-.79 1.09-1.89.97-2.99-.94.04-2.08.63-2.74 1.42-.58.68-1.09 1.79-.95 2.88 1.05.08 2.07-.51 2.72-1.31z"/>
                  </svg>
                  <span>Pagar com Apple Pay</span>
                </button>

                {isBrazilUser && (
                  <button
                    onClick={() => handleCheckout('pix')}
                    className="w-full py-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600/30 cursor-pointer shadow-sm"
                  >
                    <span className="font-black text-emerald-400">⚡</span>
                    <span>Pagar com Pix (Instantâneo - Brasil)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Menu Inferior (Atualizado com aba PRO) */}
        <footer
          style={{
            backgroundColor: colors.headerBg,
            borderTopColor: colors.borderHeader,
          }}
          className="px-4 py-3 border-t flex justify-around items-center"
        >
          <button
            onClick={() => setActiveTab('transcribe')}
            className={`flex flex-col items-center gap-1 cursor-pointer ${
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
            className={`flex flex-col items-center gap-1 cursor-pointer ${
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
            className={`flex flex-col items-center gap-1 cursor-pointer ${
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
            className={`flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'saved'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Bookmark size={18} />
            <span className="text-[10px]">Salvos</span>
          </button>
          <button
            onClick={() => setActiveTab('pro')}
            className={`flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'pro'
                ? 'text-cyan-400 font-bold'
                : 'text-cyan-500/70 hover:text-cyan-400'
            }`}
          >
            <Crown size={18} />
            <span className="text-[10px]">PRO</span>
          </button>
        </footer>

        {/* MODAL DE PAGAMENTO DIRETO (Abre ao clicar no topo) */}
        {showPaymentModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border w-full max-w-xs p-5 rounded-3xl shadow-2xl space-y-4 relative"
            >
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="text-center space-y-1 pt-1">
                <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 rounded-full mx-auto flex items-center justify-center border border-cyan-500/30">
                  <Crown size={20} />
                </div>
                <h3 className="text-base font-bold text-cyan-400">Assinar Note Verse PRO</h3>
                <p className="text-[11px] text-slate-400">
                  Acesso ilimitado a traduções, resumos e ferramentas avançadas.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleCheckout('card')}
                  className="w-full py-2.5 bg-slate-800 text-white border border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 cursor-pointer shadow-sm"
                >
                  <CreditCard size={16} className="text-cyan-400" />
                  <span>Pagar com Cartão de Crédito</span>
                </button>

                <button
                  onClick={() => handleCheckout('applepay')}
                  className="w-full py-2.5 bg-black text-white border border-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.31c.65-.79 1.09-1.89.97-2.99-.94.04-2.08.63-2.74 1.42-.58.68-1.09 1.79-.95 2.88 1.05.08 2.07-.51 2.72-1.31z"/>
                  </svg>
                  <span>Pagar com Apple Pay</span>
                </button>

                {isBrazilUser && (
                  <button
                    onClick={() => handleCheckout('pix')}
                    className="w-full py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600/30 cursor-pointer shadow-sm"
                  >
                    <span className="font-black text-emerald-400">⚡</span>
                    <span>Pagar com Pix (Instantâneo)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL SALVAR NOTA */}
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
                <label className="text-[11px] text-slate-400">Título da Nota</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Digite um título..."
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-[11px] text-slate-400 font-bold">O que deseja incluir?</label>
                
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveOptions.transcription}
                    onChange={(e) =>
                      setSaveOptions({ ...saveOptions, transcription: e.target.checked })
                    }
                    className="accent-cyan-400 rounded cursor-pointer"
                  />
                  <span>Transcrição Completa</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveOptions.translation}
                    onChange={(e) =>
                      setSaveOptions({ ...saveOptions, translation: e.target.checked })
                    }
                    className="accent-cyan-400 rounded cursor-pointer"
                  />
                  <span>Texto Traduzido</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveOptions.summary}
                    onChange={(e) =>
                      setSaveOptions({ ...saveOptions, summary: e.target.checked })
                    }
                    className="accent-cyan-400 rounded cursor-pointer"
                  />
                  <span>Resumo Executivo</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSaveNote}
                  className="flex-1 py-2 bg-cyan-500 text-black text-xs font-bold rounded-xl shadow-md hover:bg-cyan-400 cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL AUTENTICAÇÃO E PERFIL */}
        {showAuthModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="border w-full max-w-xs p-5 rounded-3xl shadow-2xl space-y-4 relative"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>

              {user ? (
                <div className="space-y-4 text-center pt-2">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 mx-auto flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{user.name}</h3>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full font-bold">
                      {user.isPro ? 'PLANO PRO ATIVO' : 'PLANO GRATUITO'}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-2 bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/30 cursor-pointer"
                  >
                    <LogOut size={14} /> Sair da Conta
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div>
                    <h3 className="text-base font-bold text-cyan-400">
                      {authMode === 'login' ? 'Aceder Note Verse' : 'Criar Conta'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {authMode === 'login'
                        ? 'Entre para sincronizar suas notas.'
                        : 'Registe-se para desbloquear recursos.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleLoginWithProvider('google')}
                      className="w-full py-2 bg-slate-800 text-white border border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 cursor-pointer"
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
                      Continuar com Google
                    </button>
                  </div>

                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-slate-800"></div>
                    <span className="text-[10px] text-slate-500">ou com e-mail</span>
                    <div className="flex-1 h-px bg-slate-800"></div>
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-2.5">
                    {authMode === 'register' && (
                      <div>
                        <input
                          type="text"
                          placeholder="O seu Nome"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    )}
                    <div>
                      <input
                        type="email"
                        placeholder="E-mail"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Palavra-passe"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-cyan-500 text-black font-bold text-xs rounded-xl shadow-md hover:bg-cyan-400 cursor-pointer"
                    >
                      {authMode === 'login' ? 'Entrar' : 'Registar'}
                    </button>
                  </form>

                  <div className="text-center pt-1">
                    <button
                      onClick={() =>
                        setAuthMode(authMode === 'login' ? 'register' : 'login')
                      }
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      {authMode === 'login'
                        ? 'Não tem conta? Registe-se'
                        : 'Já tem conta? Faça login'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
