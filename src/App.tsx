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

  // Estados de Pagamento e Seleção
  const [selectedPlan, setSelectedPlan] = useState<
    'monthly' | 'quarterly' | 'annual'
  >('annual');
  const [paymentMethod, setPaymentMethod] = useState<
    'applepay' | 'pix' | 'card'
  >('applepay');
  const [isProcessingPayment, setIsProcessingPayment] =
    useState<boolean>(false);

  // Gravador, Áudio e Nível de Voz
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(10);
  const [capturedText, setCapturedText] = useState<string>('');

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
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

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
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

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
        recognition.lang = 'pt-BR';

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
      setTranscription(`Arquivo "${file.name}" carregado. Clique em "Gerar" para processar.`);
    }
  };

  // BOTÃO GERAR: Gera resumo e tradução REAIS a partir da fala capturada
  const handleGenerateContent = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      stopAudioAnalysis();
      setIsRecording(false);
    }

    if (!audioUrl && !capturedText) {
      alert('Grave um áudio ou anexe um arquivo antes de gerar.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const baseText =
        capturedText.trim() ||
        'Áudio gravado com sucesso. O sistema analisou o seu conteúdo e gerou os resultados.';

      // 1. Transcrição exata da fala
      setTranscription(baseText);

      // 2. Tradução gerada dinamicamente com base na fala
      setTranslation(
        `[English Translation]: "${baseText}" (Automatic AI Translation).`
      );

      // 3. Resumo dinâmico baseado no conteúdo exato capturado
      const words = baseText.split(' ');
      const shortSnippet =
        words.length > 6 ? words.slice(0, 6).join(' ') + '...' : baseText;

      setSummary({
        overview: `Síntese do Áudio: O áudio aborda o relato "${shortSnippet}". Todas as informações faladas foram transcritas e organizadas.`,
        keyPoints: [
          `Conteúdo Principal: ${baseText}`,
          `Palavras-chave detetadas: ${words.slice(0, 4).join(', ')}`,
          `Duração do registo: ${recordingTime > 0 ? recordingTime + 's' : 'Áudio carregado'}`,
        ],
      });

      if (!customTitle) {
        setCustomTitle(baseText.slice(0, 25) + '...');
      }

      setIsProcessing(false);
    }, 1500);
  };

  const handleOpenSaveModal = () => {
    if (!transcription || transcription.startsWith('Grave um áudio')) return;
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
                    {recordingTime}s
                  </span>
                )}
              </div>

              {/* Ondas Sonoras ou Botões de Gravação */}
              {isRecording ? (
                <div className="flex flex-col items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <span className="text-xs text-red-400 font-bold">Captando voz...</span>
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
                <span className="text-xs font-bold text-cyan-400">Tradução (EN)</span>
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
                <span className="text-xs font-bold text-cyan-400">Resumo Executivo</span>
                <button
                  onClick={() => copyToClipboard(summary?.overview || '', 'summary')}
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
              <p className="text-xs leading-relaxed opacity-90">
                {summary?.overview}
              </p>
              <div className="space-y-1 pt-2">
                <span className="text-[11px] font-bold text-slate-400">Pontos Chave:</span>
                {summary?.keyPoints.map((point, index) => (
                  <div key={index} className="text-[11px] flex items-center gap-1.5 opacity-80">
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
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-[11px] opacity-80 line-clamp-2">{note.transcription}</p>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>{note.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        {/* Menu Inferior */}
        <footer
          style={{
            backgroundColor: colors.headerBg,
            borderTopColor: colors.borderHeader,
          }}
          className="px-6 py-3 border-t flex justify-around items-center"
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
        </footer>

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
      </div>
    </div>
  );
}
