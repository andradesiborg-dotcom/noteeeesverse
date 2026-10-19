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

  // Gravador, Áudio e Nível de Voz
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(10); // Nível do volume da voz (0 a 100)
  const [capturedText, setCapturedText] = useState<string>(''); // Texto capturado em tempo real

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
        // Normaliza o nível entre 15 e 100
        setAudioLevel(Math.max(15, Math.min(100, average * 1.5)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.warn('Não foi possível acessar o microfone para o visualizador de voz.', e);
    }
  };

  const handleStopRecordingDueToLimit = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    stopAudioAnalysis();
    setIsRecording(false);
    setShowPaywall(true);
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      // Pausar
      if (recognitionRef.current) recognitionRef.current.stop();
      stopAudioAnalysis();
      setIsRecording(false);
      // CORREÇÃO: Não limpamos capturedText ou audioUrl ao pausar,
      // para que eles permaneçam disponíveis para geração.
    } else {
      // Começar nova gravação
      // CORREÇÃO: Limpamos apenas quando clicamos em "Gravar Voz" novamente.
      if (capturedText || audioUrl) {
          setAudioUrl(null);
          setCapturedText('');
          setTranscription('Grave um áudio ou anexe um ficheiro e clique em "Gerar" para ver a transcrição, tradução e resumo.'); // Reseta o texto exibido
          setTranslation('Record an audio or upload a file and click "Generate" to see transcription, translation, and summary.');
          setSummary({overview: 'Resumo executivo do conteúdo Note Verse.', keyPoints: ['Processamento inteligente de áudio', 'Resultados instantâneos com IA']});
          setCustomTitle('');
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
        // Fallback para quando o navegador não suporta reconhecimento nativo
        setIsRecording(true);
        // Simulação básica para não-suportados
        setTimeout(() => {
          setCapturedText('Esta é uma gravação simulada do Note Verse...');
          setCustomTitle('Gravação Simulada');
        }, 1000);
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
      // CORREÇÃO: Limpamos capturedText anterior para que o arquivo tenha prioridade
      if (isRecording) {
          if (recognitionRef.current) recognitionRef.current.stop();
          stopAudioAnalysis();
          setIsRecording(false);
      }
      setCapturedText('');
      setAudioUrl(url);
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
      setTranscription(`Arquivo de áudio "${file.name}" anexado. Clique em "Gerar" para analisar.`);
    }
  };

  // Botão Gerar: Para a gravação se estiver ativa e processa o áudio capturado
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
      // CORREÇÃO: Priorizamos capturedText (gravação) sobre áudio anexado
      const finalText =
        capturedText.
