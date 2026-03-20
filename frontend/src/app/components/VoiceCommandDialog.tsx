import { Mic, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { methodParameters } from './ParametersPanel';

interface VoiceCommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (method: string, params: Record<string, string>, equation: string) => void;
}

type Step =
  | 'idle'
  | 'listening-method'
  | 'asking-equation'
  | 'listening-equation'
  | 'asking-param'
  | 'listening-param'
  | 'confirming'
  | 'processing'
  | 'error'
  | 'unsupported';

const METHOD_MAP: Record<string, string> = {
  'punto fijo': 'fixed-point',
  'biseccion': 'bisection',
  'bisección': 'bisection',
  'newton': 'newton',
  'newton raphson': 'newton',
  'newton-raphson': 'newton',
  'jacobi': 'jacobi',
  'gauss': 'gauss-seidel',
  'gauss seidel': 'gauss-seidel',
  'gauss-seidel': 'gauss-seidel',
  'lu': 'lu',
  'descomposicion lu': 'lu',
  'descomposición lu': 'lu',
  'doolittle': 'lu',
  'dollitle': 'lu',
  'doolitle': 'lu',
  'doulittle': 'lu',
  'crout': 'lu',
  'cruot': 'lu',
  'croot': 'lu',
  'croutt': 'lu',
  'croout': 'lu',
  'croute': 'lu',
  'kroute': 'lu',
  'krout': 'lu',
  'lagrange': 'lagrange',
  'interpolacion lagrange': 'lagrange',
  'interpolación lagrange': 'lagrange',
  'interpolacion de lagrange': 'lagrange',
  'interpolación de lagrange': 'lagrange',
  'interpolacion newton': 'newton-divided',
  'interpolación newton': 'newton-divided',
  'interpolacion de newton': 'newton-divided',
  'interpolación de newton': 'newton-divided',
  'trazador': 'cubic-spline',
  'trazador cubico': 'cubic-spline',
  'trazador cúbico': 'cubic-spline',
  'spline': 'cubic-spline',
  'spline cubico': 'cubic-spline',
  'spline cúbico': 'cubic-spline',
  'trazos cubicos': 'cubic-spline',
  'trazos cúbicos': 'cubic-spline'
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function normalizeText(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function serializeMatrixGrid(entries: number[][]): string {
  return entries.map((row) => row.map((x) => String(x)).join(',')).join(';');
}

const WORDS_TO_NUM: Record<string, string> = {
  cero: '0',
  uno: '1',
  dos: '2',
  tres: '3',
  cuatro: '4',
  cinco: '5',
  seis: '6',
  siete: '7',
  ocho: '8',
  nueve: '9',
  diez: '10',
  once: '11',
  doce: '12',
  trece: '13',
  catorce: '14',
  quince: '15',
  dieciseis: '16',
  diecisiete: '17',
  dieciocho: '18',
  diecinueve: '19',
  veinte: '20',
  menos: '-',
  negativo: '-',
};

function parseVoiceNumber(rawText: string): number | null {
  let numeric = rawText
    .replace(/\s+/g, '')
    .replace(/coma/g, '.')
    .replace(/punto/g, '.');

  numeric = numeric.replace(/\bexponencial\b/gi, 'e');
  numeric = numeric.replace(/\bE\b/g, 'E');

  let lower = numeric.toLowerCase();
  for (const [w, n] of Object.entries(WORDS_TO_NUM)) {
    lower = lower.replace(new RegExp(w, 'g'), n);
  }
  numeric = lower;

  const numberMatch = numeric.match(/-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?/);
  if (numberMatch) numeric = numberMatch[0];

  numeric = numeric.replace(/,$/g, '.').replace(/\.$/g, '');
  if (numeric.startsWith('.')) numeric = `0${numeric}`;
  if (numeric.startsWith('-.')) numeric = `-0${numeric.slice(1)}`;

  if (!numeric || Number.isNaN(parseFloat(numeric))) return null;
  return parseFloat(numeric);
}

function parseVoiceSizeN(rawText: string): number | null {
  const v = parseVoiceNumber(rawText);
  if (v !== null) {
    const n = Math.round(v);
    if (n >= 2 && n <= 12 && Math.abs(v - n) < 1e-6) return n;
  }
  const m = rawText.match(/\b(1[0-2]|[2-9])\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 2 && n <= 12) return n;
  }
  return null;
}

/** Una fila o un vector: separadores coma/punto y coma, luego «y» en cada trozo; corchetes opcionales. */
function parseMatrixRowVoice(rawText: string, expectedCount: number): number[] | null {
  let t = rawText.trim();
  t = t.replace(/[\[\]]/g, ' ');
  t = t.replace(/\bcoma\b/gi, ',');
  t = t.replace(/\s+/g, ' ');

  const segments = t.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  const parts: string[] = [];
  for (const seg of segments) {
    const sub = seg.split(/\s+y\s+/i).map((s) => s.trim()).filter(Boolean);
    parts.push(...sub);
  }

  if (parts.length === expectedCount) {
    const parsed = parts.map((p) => parseVoiceNumber(p));
    if (parsed.every((x) => x !== null)) return parsed as number[];
  }

  const re = /-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?/g;
  const matches = t.match(re);
  if (matches && matches.length === expectedCount) {
    return matches.map((m) => parseFloat(m));
  }

  const words = t.split(/\s+/).filter(Boolean);
  if (words.length === expectedCount) {
    const parsed = words.map((w) => parseVoiceNumber(w));
    if (parsed.every((x) => x !== null)) return parsed as number[];
  }

  return null;
}

type MatrixVoiceState =
  | null
  | { kind: 'size' }
  | { kind: 'row'; n: number; rowIndex: number; entries: number[][] }
  | { kind: 'vector'; n: number; entries: number[][] };

function equationToPythonSyntax(raw: string) {
  let s = raw.trim();

  // Normalize common operator variants
  s = s.replace(/\^/g, '**');

  // Constants and basic functions
  s = s.replace(/\b(pi|π)\b/gi, 'pi');
  s = s.replace(/\beuler\b/gi, 'E');
  s = s.replace(/\bmil\b/gi, '1000');
  s = s.replace(/\bexponencial\s+de\s+([a-zA-Z]\w*)\b/gi, 'E**$1');
  s = s.replace(/\bexponencial\s+de\s+x\b/gi, 'E**x');

  // e (as a single word) -> E (Euler)
  s = s.replace(/(^|[\s+\-*/=(])e(?=[\s+\-*/=^)]|$)/gi, '$1E');

  // Logarithms
  s = s.replace(/\blogaritmo\s+natural\b/gi, 'log(');
  s = s.replace(/\bln\b/gi, 'log(');
  s = s.replace(/\blogaritmo\b/gi, 'log(');
  s = s.replace(/\blog\b/gi, 'log(');

  // Trig functions
  s = s.replace(/\bseno\b/gi, 'sin(');
  s = s.replace(/\bsen\b/gi, 'sin(');
  s = s.replace(/\bsin\b/gi, 'sin(');
  s = s.replace(/\bcoseno\b/gi, 'cos(');
  s = s.replace(/\bcos\b/gi, 'cos(');
  s = s.replace(/\btangente\b/gi, 'tan(');
  s = s.replace(/\btan\b/gi, 'tan(');

  // Square root
  s = s.replace(/\bra[ií]z\b/gi, 'sqrt(');
  s = s.replace(/\bsqrt\b/gi, 'sqrt(');

  // Powers
  s = s.replace(/\bal\s+cuadrado\b/gi, '**2');
  s = s.replace(/\bal\s+cubo\b/gi, '**3');
  s = s.replace(/\belevado\s+a\b/gi, '**');
  s = s.replace(/\ba\s+la\b/gi, '**');

  // x a la 4 => x**4
  s = s.replace(/\b([a-zA-Z]\w*)\s+\*\*\s+(-?\d+(?:[.,]\d+)?)\b/gi, (_, base, exp) => {
    const e = String(exp).replace(',', '.');
    return `${base}**${e}`;
  });

  // Spanish voice patterns -> python operators
  s = s.replace(/\bpor\b/gi, '*');
  s = s.replace(/\bmultiplicado\s+por\b/gi, '*');
  s = s.replace(/\bentre\b/gi, '/');
  s = s.replace(/\bdividido\s+entre\b/gi, '/');
  s = s.replace(/\bm[aá]s\b/gi, '+');
  s = s.replace(/\bmenos\b/gi, '-');
  s = s.replace(/\bnegativo\b/gi, '-');
  s = s.replace(/\bnegatico\b/gi, '-');

  // Trig shortcuts (ensure parentheses)
  s = s.replace(/\bsen\s*\(/gi, 'sin(');
  s = s.replace(/\btg\s*\(/gi, 'tan(');

  // Decimal comma -> dot (only in numbers)
  s = s.replace(/(\d),(\d)/g, '$1.$2');

  // Implicit multiplication: 2x -> 2*x, 3(x+1) -> 3*(x+1)
  s = s.replace(/(\d)\s*([a-zA-Z(])/g, '$1*$2');

  // Remove trailing punctuation sometimes added by STT
  s = s.replace(/[.,;:]+$/g, '');

  return s;
}

const METHODS_REQUIRE_EQUATION = new Set([
  'newton',
  'bisection',
  'fixed-point',
]);

const MATRIX_VOICE_METHODS = new Set(['jacobi', 'gauss-seidel', 'lu']);

export function VoiceCommandDialog({ isOpen, onClose, onComplete }: VoiceCommandDialogProps) {
  const [step, setStep] = useState<Step>('idle');
  const [message, setMessage] = useState('');
  const [currentMethod, setCurrentMethod] = useState<string | null>(null);
  const [paramsList, setParamsList] = useState<any[]>([]);
  const [currentParamIdx, setCurrentParamIdx] = useState(0);
  const [collectedParams, setCollectedParams] = useState<Record<string, string>>({});
  const [equation, setEquation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [matrixVoice, setMatrixVoice] = useState<MatrixVoiceState>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isSynthesisSpeaking = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingResolverRef = useRef<{
    resolve: (text: string) => void;
    reject: (err: unknown) => void;
  } | null>(null);
  const maxDurationTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const startFlowTimerRef = useRef<number | null>(null);
  const flowIdRef = useRef(0);
  const speechIdRef = useRef(0);
  const recordingIdRef = useRef(0);
  const matrixVoiceStartIdxRef = useRef(0);

  // Keep a ref to the latest state to avoid stale closures in recognition.onresult
  const stateRef = useRef({
    step,
    currentMethod,
    paramsList,
    currentParamIdx,
    collectedParams,
    equation,
    matrixVoice,
  });

  useEffect(() => {
    stateRef.current = {
      step,
      currentMethod,
      paramsList,
      currentParamIdx,
      collectedParams,
      equation,
      matrixVoice,
    };
  }, [step, currentMethod, paramsList, currentParamIdx, collectedParams, equation, matrixVoice]);

  useEffect(() => {
    if (isOpen) {
      flowIdRef.current += 1;
      resetState();
      // Small delay to ensure dialog is rendered before starting
      if (startFlowTimerRef.current != null) window.clearTimeout(startFlowTimerRef.current);
      startFlowTimerRef.current = window.setTimeout(() => startFlow(flowIdRef.current), 300);
    } else {
      stopAll();
    }
    
    return () => {
      stopAll();
    };
  }, [isOpen]);

  const stopAll = () => {
    stopRecording();
    window.speechSynthesis.cancel();
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (startFlowTimerRef.current != null) {
      window.clearTimeout(startFlowTimerRef.current);
      startFlowTimerRef.current = null;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    if (maxDurationTimerRef.current != null) {
      window.clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    recordingResolverRef.current = null;
  };

  const resetState = () => {
    setCurrentMethod(null);
    setParamsList([]);
    setCurrentParamIdx(0);
    setCollectedParams({});
    setEquation('');
    setStep('idle');
    setMessage('');
    setIsRecording(false);
    audioChunksRef.current = [];
    recordingResolverRef.current = null;
    if (maxDurationTimerRef.current != null) {
      window.clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (startFlowTimerRef.current != null) {
      window.clearTimeout(startFlowTimerRef.current);
      startFlowTimerRef.current = null;
    }
    setMatrixVoice(null);
  };

  const speakText = (text: string, callback?: () => void) => {
    stopAll();
    isSynthesisSpeaking.current = true;
    const speechId = ++speechIdRef.current;
    let called = false;
    const finishOnce = () => {
      if (called) return;
      if (speechId !== speechIdRef.current) return;
      called = true;
      isSynthesisSpeaking.current = false;
      callback?.();
    };
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    
    utterance.onend = () => {
      finishOnce();
    };
    
    utterance.onerror = () => {
      finishOnce();
    };
    
    // Fallback if onend doesn't fire
    window.setTimeout(() => finishOnce(), text.length * 120 + 2000);

    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const flowId = flowIdRef.current;
        const recordingId = ++recordingIdRef.current;
        stopRecording();

        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 44100,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
        streamRef.current = stream;

        // Use webm format with opus codec (best compatibility)
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4';
        
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        recordingResolverRef.current = { resolve, reject };
        setIsRecording(true);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (flowId !== flowIdRef.current || recordingId !== recordingIdRef.current) return;
          setIsRecording(false);
          if (maxDurationTimerRef.current != null) {
            window.clearTimeout(maxDurationTimerRef.current);
            maxDurationTimerRef.current = null;
          }
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          
          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
        if (audioBlob.size === 0) {
          reject(new Error('No se grabó ningún audio. Por favor, asegúrese de permitir el acceso al micrófono e intente de nuevo.'));
          return;
        }

          try {
            // Send to backend
            const formData = new FormData();
            const filename = mimeType.includes('mp4') ? 'voice-command.mp4' : 'voice-command.webm';
            formData.append('audio', audioBlob, filename);

            const response = await fetch(`${API_URL}/api/voice/transcribe`, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              const errorMsg = errorData.detail || errorData.message || `Error HTTP ${response.status}`;
              throw new Error(errorMsg);
            }

            const data = await response.json();
            if (data.success) {
              const transcriptText = data.text ?? '';
              setMessage(`Escuché: "${transcriptText}"`);
              // Mostrar la transcripción antes de procesar la intención
              await new Promise((r) => window.setTimeout(r, 1000));
              resolve(transcriptText);
            } else {
              throw new Error('Transcription failed');
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
            reject(new Error(`Error de transcripción: ${errorMsg}`));
          }
        };

        mediaRecorder.onerror = () => {
          reject(new Error('Error al grabar audio. Verifique que su micrófono esté funcionando correctamente y que haya permitido el acceso.'));
        };

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        // Safety auto-stop (user-controlled, but we still cap it)
        maxDurationTimerRef.current = window.setTimeout(() => {
          if (flowId !== flowIdRef.current || recordingId !== recordingIdRef.current) return;
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, 20000);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error de acceso al micrófono';
        reject(new Error(`No se pudo acceder al micrófono: ${errorMsg}. Verifique los permisos de su navegador.`));
      }
    });
  };

  const stopAndFinalizeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
  };

  const startFlow = (flowId = flowIdRef.current) => {
    if (flowId !== flowIdRef.current) return;
    setMessage('¿Qué método deseas usar?');
    speakText('Hola, ¿qué método deseas usar?', async () => {
      if (flowId !== flowIdRef.current) return;
      setStep('listening-method');
      setMessage(`Te escucho. Cuando termines, presiona "Detener".`);
      try {
        const transcript = await startRecording();
        if (flowId !== flowIdRef.current) return;
        handleSpeechResult(transcript);
      } catch (error) {
        console.error('Recording error:', error);
        handleError();
      }
    });
  };

  const handleError = () => {
    const flowId = flowIdRef.current;
    setStep('error');
    setMessage('No pude escucharte bien. Intentemos de nuevo.');
    speakText('Vaya, no pude escucharte bien. Intentemos de nuevo.', () => {
      if (flowId !== flowIdRef.current) return;
      if (retryTimerRef.current != null) window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = window.setTimeout(() => {
        if (flowId !== flowIdRef.current) return;
        if (stateRef.current.currentMethod == null) {
          startFlow(flowId);
        } else if (stateRef.current.matrixVoice) {
          retryMatrixVoice();
        } else {
          askCurrentParam();
        }
      }, 500);
    });
  };

  const handleSpeechResult = (transcript: string) => {
    const normalized = normalizeText(transcript);
    const currentState = stateRef.current;
    
    if (currentState.step === 'listening-method') {
      setStep('processing');
      processMethodSelection(normalized, transcript);
    } else if (currentState.step === 'listening-equation') {
      setStep('processing');
      processEquationInput(transcript);
    } else if (currentState.step === 'listening-param') {
      setStep('processing');
      if (currentState.matrixVoice) {
        processMatrixVoiceInput(normalized, transcript);
        return;
      }
      processParamInput(normalized, transcript, currentState);
    }
  };

  const askEquation = () => {
    setStep('asking-equation');
    setMessage('Dime la ecuación a usar.');

    const capturedFlowId = flowIdRef.current;
    speakText('Ahora dime la ecuación a usar.', async () => {
      if (capturedFlowId !== flowIdRef.current) return;
      setStep('listening-equation');
      setMessage(`Te escucho. Cuando termines, presiona "Detener".`);
      try {
        const transcript = await startRecording();
        if (capturedFlowId !== flowIdRef.current) return;
        handleSpeechResult(transcript);
      } catch (error) {
        console.error('Recording error:', error);
        handleError();
      }
    });
  };

  const processEquationInput = (rawText: string) => {
    const eq = equationToPythonSyntax(rawText);
    setEquation(eq);
    setStep('confirming');
    setMessage(`Ecuación: ${eq || '(vacía)'}`);
    speakText('Listo.', () => {
      const method = stateRef.current.currentMethod;
      const params = stateRef.current.paramsList;
      if (method && params.length > 0) {
        askParam(0, params);
      } else if (method) {
        finishFlow(method, stateRef.current.collectedParams);
      } else {
        startFlow(flowIdRef.current);
      }
    });
  };

  const processMethodSelection = (normalizedText: string, rawText: string) => {
    let foundMethod: string | null = null;
    let fallbackMethodName = "";
    
    // Sort keys by length descending to match longer phrases first
    const sortedKeys = Object.keys(METHOD_MAP).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (normalizedText.includes(key)) {
        foundMethod = METHOD_MAP[key];
        fallbackMethodName = key;
        break;
      }
    }

    if (foundMethod) {
      setCurrentMethod(foundMethod);

      let params = methodParameters[foundMethod] || [];
      let initialCollectedParams: Record<string, string> = {};

      // Inferir variante de LU a partir de lo que dijo el usuario
      if (foundMethod === 'lu') {
        const wantsCrout = /(crout|croot|croout|cruot|kroute|kroute|krout)/i.test(
          normalizedText
        );
        const wantsDoolittle = /(dool|doll|doul|doolit|dollit)/i.test(normalizedText);

        if (wantsCrout && !wantsDoolittle) {
          initialCollectedParams = { lu_variant: 'crout' };
          params = params.filter((p) => p.name !== 'lu_variant');
        } else if (wantsDoolittle && !wantsCrout) {
          initialCollectedParams = { lu_variant: 'doolittle' };
          params = params.filter((p) => p.name !== 'lu_variant');
        }
      }

      setCollectedParams(initialCollectedParams);
      setParamsList(params);
      setCurrentParamIdx(0);
      
      setMessage(`Método seleccionado: ${fallbackMethodName}`);
      const methodToUse = foundMethod;
      speakText(`De acuerdo, usaremos el método de ${fallbackMethodName}.`, () => {
        if (METHODS_REQUIRE_EQUATION.has(methodToUse)) {
          askEquation();
          return;
        }

        if (params.length > 0) {
          askParam(0, params);
          return;
        }

        finishFlow(methodToUse, {});
      });
    } else {
      setStep('error');
      setMessage(`No reconocí el método. ¿Puedes repetirlo?`);
      speakText('No pude reconocer ese método. ¿Puedes repetirlo?', () => {
        const flowId = flowIdRef.current;
        if (flowId !== flowIdRef.current) return;
        setStep('listening-method');
        setMessage(`Te escucho. Cuando termines, presiona "Detener".`);
        startRecording().then(handleSpeechResult).catch(() => handleError());
      });
    }
  };

  const askCurrentParam = () => {
    askParam(stateRef.current.currentParamIdx, stateRef.current.paramsList);
  };

  function askMatrixVoiceSize() {
    setStep('asking-param');
    setMessage('Tamaño n (2 a 12), como el selector en pantalla.');
    speakText(
      '¿De cuánto es la matriz cuadrada? Di un número entre dos y doce, igual que el control de tamaño en la pantalla.',
      async () => {
        setStep('listening-param');
        setMessage('Te escucho. Cuando termines, presiona "Detener".');
        try {
          const transcript = await startRecording();
          handleSpeechResult(transcript);
        } catch (error) {
          console.error('Recording error:', error);
          handleError();
        }
      }
    );
  }

  function askMatrixVoiceRow(rowIndex: number, n: number, entries: number[][]) {
    setMatrixVoice({ kind: 'row', n, rowIndex, entries });
    setStep('asking-param');
    const ri = rowIndex + 1;
    setMessage(`Matriz A — fila ${ri} (${n} números)`);
    speakText(
      `Fila ${ri}. Dicta los ${n} números de esa fila: puedes separarlos con coma, con «y», o entre corchetes, por ejemplo: 4 coma 1 coma 2, o 4 y 1 y 2.`,
      async () => {
        setStep('listening-param');
        setMessage('Te escucho...');
        try {
          const transcript = await startRecording();
          handleSpeechResult(transcript);
        } catch (error) {
          console.error('Recording error:', error);
          handleError();
        }
      }
    );
  }

  function askMatrixVoiceVector(n: number, entries: number[][]) {
    setMatrixVoice({ kind: 'vector', n, entries });
    setStep('asking-param');
    const method = stateRef.current.currentMethod;
    const isLu = method === 'lu';
    setMessage(`Vector b (${n} términos)`);
    speakText(
      isLu
        ? 'Vector b: di los términos separados por coma o por «y», o entre corchetes. O di omitir si solo quieres L y U.'
        : `Di los ${n} términos del vector b: coma, «y», o corchetes.`,
      async () => {
        setStep('listening-param');
        setMessage('Te escucho...');
        try {
          const transcript = await startRecording();
          handleSpeechResult(transcript);
        } catch (error) {
          console.error('Recording error:', error);
          handleError();
        }
      }
    );
  }

  function finishMatrixVoice(entries: number[][], b: number[] | null, vectorSkipped: boolean) {
    const matrixStr = serializeMatrixGrid(entries);
    const vectorStr = vectorSkipped ? '' : b!.map(String).join(',');
    const idx = matrixVoiceStartIdxRef.current;
    setMatrixVoice(null);
    setCollectedParams((prev) => ({ ...prev, matrixA: matrixStr, vectorB: vectorStr }));
    const nextIdx = idx + 2;
    setCurrentParamIdx(nextIdx);
    setStep('confirming');
    setMessage('Matriz y vector listos.');
    speakText('Matriz y vector listos.', () => {
      askParam(nextIdx, stateRef.current.paramsList);
    });
  }

  function retryMatrixVoice() {
    const mv = stateRef.current.matrixVoice;
    if (!mv) {
      askCurrentParam();
      return;
    }
    if (mv.kind === 'size') askMatrixVoiceSize();
    else if (mv.kind === 'row') askMatrixVoiceRow(mv.rowIndex, mv.n, mv.entries);
    else askMatrixVoiceVector(mv.n, mv.entries);
  }

  function processMatrixVoiceInput(normText: string, rawText: string) {
    const mv = stateRef.current.matrixVoice;
    if (!mv) return;

    if (mv.kind === 'size') {
      const n = parseVoiceSizeN(rawText);
      if (n === null) {
        setStep('asking-param');
        speakText('No entendí el tamaño. Di un número entre dos y doce.', () => {
          askMatrixVoiceSize();
        });
        return;
      }
      const entries = Array.from({ length: n }, () => Array(n).fill(0));
      setMatrixVoice({ kind: 'row', n, rowIndex: 0, entries });
      setStep('confirming');
      speakText(`Entendido, matriz de orden ${n}.`, () => {
        askMatrixVoiceRow(0, n, entries);
      });
      return;
    }

    if (mv.kind === 'row') {
      const row = parseMatrixRowVoice(rawText, mv.n);
      if (row === null) {
        speakText(`Necesito ${mv.n} números en esta fila. Repite.`, () => {
          askMatrixVoiceRow(mv.rowIndex, mv.n, mv.entries);
        });
        return;
      }
      const next = mv.entries.map((r) => r.slice());
      next[mv.rowIndex] = row;
      const { n, rowIndex } = mv;
      if (rowIndex < n - 1) {
        const ri = rowIndex + 1;
        setMatrixVoice({ kind: 'row', n, rowIndex: ri, entries: next });
        setStep('confirming');
        speakText('Fila registrada.', () => {
          askMatrixVoiceRow(ri, n, next);
        });
        return;
      }
      setMatrixVoice({ kind: 'vector', n, entries: next });
      setStep('confirming');
      speakText('Matriz completa.', () => {
        askMatrixVoiceVector(n, next);
      });
      return;
    }

    if (mv.kind === 'vector') {
      const method = stateRef.current.currentMethod;
      const isLu = method === 'lu';
      if (
        isLu &&
        /\b(omitir|omit|saltar|skip|ninguno|sin\s+vector|solo\s+lu|no\s+quiero|no\s+hace\s+falta)\b/i.test(
          normText
        )
      ) {
        finishMatrixVoice(mv.entries, null, true);
        return;
      }
      const b = parseMatrixRowVoice(rawText, mv.n);
      if (b === null) {
        speakText('No pude leer el vector. Repite con los mismos separadores.', () => {
          askMatrixVoiceVector(mv.n, mv.entries);
        });
        return;
      }
      finishMatrixVoice(mv.entries, b, false);
    }
  }

  const askParam = (idx: number, params: any[]) => {
    if (idx >= params.length) {
      finishFlow(stateRef.current.currentMethod!, stateRef.current.collectedParams);
      return;
    }
    
    const param = params[idx];
    const methodToUse = stateRef.current.currentMethod;
    const isMatrixMethod = methodToUse != null && MATRIX_VOICE_METHODS.has(methodToUse);
    if (param?.name === 'matrixA' && isMatrixMethod) {
      matrixVoiceStartIdxRef.current = idx;
      setMatrixVoice({ kind: 'size' });
      askMatrixVoiceSize();
      return;
    }

    setStep('asking-param');
    const isInterpolationXEval =
      (methodToUse === 'lagrange' ||
        methodToUse === 'newton-divided' ||
        methodToUse === 'cubic-spline') &&
      param?.name === 'x_eval';

    setMessage(
      isInterpolationXEval
        ? '¿En qué valor de x deseas evaluar la interpolación?'
        : `Por favor dime el valor para: ${param.label}`
    );

    const promptText = isInterpolationXEval
      ? '¿En qué valor de x deseas evaluar la interpolación?'
      : `Por favor, dime el valor de ${param.label.split('(')[0].trim()}`;
    speakText(promptText, async () => {
      setStep('listening-param');
      setMessage(`Te escucho. Cuando termines, presiona "Detener".`);
      try {
        const transcript = await startRecording();
        handleSpeechResult(transcript);
      } catch (error) {
        console.error('Recording error:', error);
        handleError();
      }
    });
  };

  const processParamInput = (normText: string, rawText: string, state: any) => {
    const param = state.paramsList[state.currentParamIdx];
    if (!param) return;
    
    let parsedValue = rawText;
    let isValid = true;
    
    if (param.type === 'number') {
      const v = parseVoiceNumber(rawText);
      if (v !== null) {
        parsedValue = String(v);
      } else {
        isValid = false;
      }
    } else if (param.type === 'text') {
      parsedValue = rawText.trim();
    }

    if (!isValid) {
      setStep('asking-param');
      setMessage('No pude entender bien los datos. Repítelo por favor.');
      speakText('No pude entender bien los datos. Repítelo por favor.', () => {
        askParam(state.currentParamIdx, state.paramsList);
      });
      return;
    }

    const newCollected = { ...state.collectedParams, [param.name]: parsedValue };
    setCollectedParams(newCollected);
    
    setStep('confirming');
    const display =
      param.name === 'vectorB' && parsedValue === ''
        ? '(sin vector b)'
        : parsedValue;
    setMessage(`Entendido: ${display}`);
    speakText(`Entendido, ${display}.`, () => {
      const nextIdx = state.currentParamIdx + 1;
      setCurrentParamIdx(nextIdx);
      askParam(nextIdx, state.paramsList);
    });
  };

  const finishFlow = (method: string, finalParams: Record<string, string>) => {
    setStep('confirming');
    setMessage('¡Todo listo! Calculando...');
    speakText('Todos los datos capturados. Calculando resultados.', () => {
      onComplete(method, finalParams, stateRef.current.equation);
      onClose();
    });
  };

  if (!isOpen) return null;

  const activeParam = paramsList[currentParamIdx];
  const voiceMatrixMode =
    currentMethod != null &&
    MATRIX_VOICE_METHODS.has(currentMethod) &&
    (step === 'listening-param' || step === 'asking-param');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-[#F8FAFC]">Asistente de Voz (IA)</h3>
            <p className="text-sm text-[#94A3B8] mt-1">Powered by Groq Whisper</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1E293B] text-[#64748B] hover:text-[#F8FAFC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-8">
          <AnimatePresence mode="wait">
            {step === 'processing' ? (
              <motion.div
                key="processing"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500"
              >
                <Loader2 className="w-12 h-12 animate-spin" />
              </motion.div>
            ) : step === 'confirming' ? (
              <motion.div
                key="confirming"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center text-green-500"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
            ) : step === 'error' ? (
              <motion.div
                key="error"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center text-red-500"
              >
                <AlertCircle className="w-12 h-12" />
              </motion.div>
            ) : (
              <motion.div
                key="listening"
                animate={{
                  scale: step.includes('listening') ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: step.includes('listening') ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-colors duration-500 ${
                  step.includes('listening') 
                    ? 'bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] shadow-[#3B82F6]/30' 
                    : 'bg-gradient-to-br from-[#475569] to-[#334155] shadow-none'
                }`}
              >
                <Mic className="w-12 h-12 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mt-6 text-center h-12 flex items-center justify-center">
             <p className="text-[#CBD5E1] font-medium text-lg leading-snug">{message}</p>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            {isRecording ? (
              <>
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-300 text-xs font-semibold">Grabando voz...</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 bg-[#64748B] rounded-full" />
                <span className="text-[#64748B] text-xs font-semibold">No se está grabando</span>
              </>
            )}
          </div>

          {(step === 'listening-method' || step === 'listening-equation' || step === 'listening-param') && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={stopAndFinalizeRecording}
                disabled={!isRecording}
                className={`px-4 py-2 rounded-lg font-semibold transition-all border ${
                  isRecording
                    ? 'bg-red-500/20 text-red-200 border-red-500/30 hover:bg-red-500/30'
                    : 'bg-[#1E293B]/40 text-[#64748B] border-[#334155]/50 cursor-not-allowed'
                }`}
              >
                Detener
              </button>
            </div>
          )}
        </div>
        
        {/* Helper text dynamically appearing based on state */}
        <div className="bg-[#1E293B]/40 rounded-lg p-4 border border-[#334155]/50 mt-4 min-h-[90px]">
          {step === 'listening-method' || step === 'idle' ? (
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Ejemplo:</p>
              <p className="text-sm text-[#94A3B8]">"Quiero usar el método de bisección"</p>
              <p className="text-sm text-[#94A3B8] mt-1">"Jacobi" · "Gauss Seidel" · "LU" · "Trazador Cúbico"</p>
            </div>
          ) : step === 'listening-equation' ? (
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Ecuación:</p>
              <p className="text-sm text-[#94A3B8]">Ej: "x**3 - 2*x - 5"</p>
            </div>
          ) : voiceMatrixMode && matrixVoice?.kind === 'size' ? (
            <div className="space-y-2 text-left">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Tamaño (como en pantalla)</p>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Di <span className="text-[#CBD5E1]">un número entre 2 y 12</span> para el orden n (igual que el selector de tamaño).
              </p>
              <p className="text-sm text-[#94A3B8]">Ej: «tres», «4», «doce».</p>
            </div>
          ) : voiceMatrixMode && matrixVoice?.kind === 'row' ? (
            <div className="space-y-2 text-left">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Fila completa</p>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Fila {matrixVoice.rowIndex + 1}: di los {matrixVoice.n} números. Separadores: <span className="text-[#CBD5E1]">coma</span>,{' '}
                <span className="text-[#CBD5E1]">«y»</span>, o <span className="text-[#CBD5E1]">[ ]</span>. Ej: «4, 1, 2» o «4 y 1 y 2».
              </p>
            </div>
          ) : voiceMatrixMode && matrixVoice?.kind === 'vector' ? (
            <div className="space-y-2 text-left">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Vector b de una vez</p>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Los {matrixVoice.n} términos con coma, «y» o corchetes.
              </p>
              {currentMethod === 'lu' ? (
                <p className="text-xs text-[#64748B]">Solo LU: «omitir» si no quieres b.</p>
              ) : null}
            </div>
          ) : step === 'listening-param' || step === 'asking-param' ? (
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Responde con el valor:</p>
              <p className="text-sm text-[#94A3B8]">
                {activeParam?.name === 'tolerance'
                  ? 'Ej: "1e-4", "0.0001" o "un punto cero cero cero uno"'
                  : 'Ej: "Cinco" o "Uno punto dos" o "-0.5"'}
              </p>
            </div>
          ) : step === 'processing' ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-[#64748B]">Enviando a Groq Whisper...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-[#64748B]">Procesando...</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
