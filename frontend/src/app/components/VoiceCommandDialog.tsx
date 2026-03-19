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
  'crout': 'lu',
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

function equationToPythonSyntax(raw: string) {
  let s = raw.trim();

  // Normalize common operator variants
  s = s.replace(/\^/g, '**');

  // Spanish voice patterns -> python operators
  // x a la 4 => x**4
  s = s.replace(/\b([a-zA-Z]\w*)\s+a\s+la\s+(-?\d+(?:[.,]\d+)?)\b/gi, (_, base, exp) => {
    const e = String(exp).replace(',', '.');
    return `${base}**${e}`;
  });
  // ( ... ) a la 4 => ( ... )**4
  s = s.replace(/(\))\s+a\s+la\s+(-?\d+(?:[.,]\d+)?)\b/gi, (_, close, exp) => {
    const e = String(exp).replace(',', '.');
    return `${close}**${e}`;
  });

  // x elevado a 2  => x**2
  s = s.replace(/\b([a-zA-Z]\w*)\s+elevado\s+a\s+(-?\d+(?:[.,]\d+)?)\b/gi, (_, base, exp) => {
    const e = String(exp).replace(',', '.');
    return `${base}**${e}`;
  });
  // ( ... ) elevado a 2 => ( ... )**2
  s = s.replace(/(\))\s+elevado\s+a\s+(-?\d+(?:[.,]\d+)?)\b/gi, (_, close, exp) => {
    const e = String(exp).replace(',', '.');
    return `${close}**${e}`;
  });

  // al cuadrado / al cubo
  s = s.replace(/\bal\s+cuadrado\b/gi, '**2');
  s = s.replace(/\bal\s+cubo\b/gi, '**3');

  // por / entre / más / menos
  s = s.replace(/\bpor\b/gi, '*');
  s = s.replace(/\bentre\b/gi, '/');
  s = s.replace(/\bm[aá]s\b/gi, '+');
  s = s.replace(/\bmenos\b/gi, '-');

  // Trig shortcuts (sen -> sin)
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

export function VoiceCommandDialog({ isOpen, onClose, onComplete }: VoiceCommandDialogProps) {
  const [step, setStep] = useState<Step>('idle');
  const [message, setMessage] = useState('');
  const [currentMethod, setCurrentMethod] = useState<string | null>(null);
  const [paramsList, setParamsList] = useState<any[]>([]);
  const [currentParamIdx, setCurrentParamIdx] = useState(0);
  const [collectedParams, setCollectedParams] = useState<Record<string, string>>({});
  const [equation, setEquation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
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

  // Keep a ref to the latest state to avoid stale closures in recognition.onresult
  const stateRef = useRef({
    step,
    currentMethod,
    paramsList,
    currentParamIdx,
    collectedParams,
    equation,
  });

  useEffect(() => {
    stateRef.current = {
      step,
      currentMethod,
      paramsList,
      currentParamIdx,
      collectedParams,
      equation,
    };
  }, [step, currentMethod, paramsList, currentParamIdx, collectedParams, equation]);

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
            reject(new Error('No audio recorded'));
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
              throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
              resolve(data.text);
            } else {
              throw new Error('Transcription failed');
            }
          } catch (error) {
            reject(error);
          }
        };

        mediaRecorder.onerror = () => {
          reject(new Error('MediaRecorder error'));
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
        reject(error);
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
      processParamInput(normalized, transcript, currentState);
    }
  };

  const askEquation = () => {
    setStep('asking-equation');
    setMessage('Dime la ecuación a usar.');

    speakText('Ahora dime la ecuación a usar.', async () => {
      const flowId = flowIdRef.current;
      if (flowId !== flowIdRef.current) return;
      setStep('listening-equation');
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
        finishFlow(method, stateRef.current.collectedParams, stateRef.current.equation);
      } else {
        startFlow(flowIdRef.current);
      }
    });
  };

  const processMethodSelection = (normalizedText: string, rawText: string) => {
    let foundMethod = null;
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
      const params = methodParameters[foundMethod] || [];
      setParamsList(params);
      setCurrentParamIdx(0);
      
      setMessage(`Método seleccionado: ${fallbackMethodName}`);
      speakText(`De acuerdo, usaremos el método de ${fallbackMethodName}.`, () => {
        if (METHODS_REQUIRE_EQUATION.has(foundMethod)) {
          askEquation();
          return;
        }

        if (params.length > 0) {
          askParam(0, params);
          return;
        }

        finishFlow(foundMethod, {}, '');
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

  const askParam = (idx: number, params: any[]) => {
    if (idx >= params.length) {
      finishFlow(stateRef.current.currentMethod!, stateRef.current.collectedParams, stateRef.current.equation);
      return;
    }
    
    const param = params[idx];
    setStep('asking-param');
    setMessage(`Por favor dime el valor para: ${param.label}`);
    
    const promptText = `Por favor, dime el valor de ${param.label.split('(')[0].trim()}`;
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
    
    if (param.type === 'number') {
      // Clean up the text for number parsing
      let numeric = rawText.replace(/ /g, '').replace(/coma/g, '.').replace(/punto/g, '.');
      
      // Word to number mapping (Spanish)
      const wordsToNum: Record<string, string> = {
        'cero': '0', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
        'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9',
        'diez': '10', 'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14',
        'quince': '15', 'dieciseis': '16', 'diecisiete': '17', 'dieciocho': '18',
        'diecinueve': '19', 'veinte': '20', 'menos': '-', 'negativo': '-'
      };
      
      for (const [w, n] of Object.entries(wordsToNum)) {
        numeric = numeric.toLowerCase().replace(new RegExp(w, 'g'), n);
      }
      
      // Extract number (including decimals and negatives)
      const numberMatch = numeric.match(/-?\d+\.?\d*/);
      if (numberMatch) {
        numeric = numberMatch[0];
      }

      // Normalize common STT artifacts like trailing dots: "1." -> "1"
      numeric = numeric.replace(/,$/g, '.').replace(/\.$/g, '');
      if (numeric.startsWith('.')) numeric = `0${numeric}`;
      if (numeric.startsWith('-.')) numeric = `-0${numeric.slice(1)}`;
      
      if (numeric && !isNaN(parseFloat(numeric))) {
        parsedValue = numeric;
      }
    }

    const newCollected = { ...state.collectedParams, [param.name]: parsedValue };
    setCollectedParams(newCollected);
    
    setStep('confirming');
    setMessage(`Entendido: ${parsedValue}`);
    speakText(`Entendido, ${parsedValue}.`, () => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
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
              <p className="text-sm text-[#94A3B8] mt-1">"Trazador Cúbico"</p>
            </div>
          ) : step === 'listening-equation' ? (
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Ecuación:</p>
              <p className="text-sm text-[#94A3B8]">Ej: "x**3 - 2*x - 5"</p>
            </div>
          ) : step === 'listening-param' ? (
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Responde con el valor:</p>
              <p className="text-sm text-[#94A3B8]">Ej: "Cinco" o "Uno punto dos" o "-0.5"</p>
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
