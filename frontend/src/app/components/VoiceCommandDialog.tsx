import { useState, useEffect } from 'react';
import { Mic, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface VoiceCommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceCommandDialog({ isOpen, onClose }: VoiceCommandDialogProps) {
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setStatus('idle');
      setErrorMsg('');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus('error');
      setErrorMsg('Tu navegador no soporta reconocimiento de voz. Prueba con Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-HN';
    recognition.continuous = false;
    recognition.interimResults = true;

    setStatus('listening');

    recognition.onresult = (event: any) => {
      const result = event.results[0];
      const text = result[0].transcript;
      setTranscript(text);

      if (result.isFinal) {
        setStatus('processing');
        // Give the user a moment to see the result, then speak it
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(`Escuché: ${text}`);
        utterance.lang = 'es-HN';
        synth.speak(utterance);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        setStatus('error');
        setErrorMsg('No se detectó voz. Intenta hablar más cerca del micrófono.');
      } else if (event.error === 'not-allowed') {
        setStatus('error');
        setErrorMsg('Permiso de micrófono denegado. Habilítalo en la configuración del navegador.');
      } else {
        setStatus('error');
        setErrorMsg(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    try {
      recognition.start();
    } catch (e) {
      // Already started
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const bgPrimary = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const border = isDark ? 'border-[#1E293B]' : 'border-[#E2E8F0]';
  const textPrimary = isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]';
  const textSecondary = isDark ? 'text-[#94A3B8]' : 'text-[#475569]';
  const textMuted = isDark ? 'text-[#64748B]' : 'text-[#64748B]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${bgPrimary} border ${border} rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4`}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className={`text-xl font-semibold ${textPrimary}`}>Comando de Voz</h3>
            <p className={`text-sm ${textSecondary} mt-1`}>
              {status === 'listening' ? 'Habla ahora...' : 
               status === 'processing' ? 'Procesando...' :
               status === 'error' ? 'Error' : 'Preparando...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#1E293B] text-[#64748B] hover:text-[#F8FAFC]' : 'hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#0F172A]'} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Animated Microphone */}
        <div className="flex flex-col items-center justify-center py-6">
          {status === 'error' ? (
            <div className={`w-24 h-24 rounded-full ${isDark ? 'bg-red-500/20' : 'bg-red-50'} flex items-center justify-center`}>
              <X className={`w-12 h-12 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            </div>
          ) : (
            <motion.div
              animate={status === 'listening' ? {
                scale: [1, 1.15, 1],
                boxShadow: ['0 0 0 0 rgba(59,130,246,0.3)', '0 0 0 20px rgba(59,130,246,0)', '0 0 0 0 rgba(59,130,246,0.3)']
              } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] flex items-center justify-center shadow-lg shadow-[#3B82F6]/30"
            >
              {status === 'processing' ? (
                <Volume2 className="w-12 h-12 text-white" />
              ) : (
                <Mic className="w-12 h-12 text-white" />
              )}
            </motion.div>
          )}

          {/* Transcript display */}
          <AnimatePresence mode="wait">
            {transcript ? (
              <motion.div
                key="transcript"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 px-4 py-3 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#F1F5F9]'} w-full text-center`}
              >
                <p className={`text-xs ${textMuted} mb-1`}>Transcripción:</p>
                <p className={`text-base font-medium ${textPrimary}`}>"{transcript}"</p>
              </motion.div>
            ) : status === 'error' ? (
              <motion.p
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mt-6 text-sm text-center ${isDark ? 'text-red-400' : 'text-red-500'}`}
              >
                {errorMsg}
              </motion.p>
            ) : (
              <motion.p
                key="listening"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${textSecondary} mt-6 text-center`}
              >
                {status === 'listening' ? 'Escuchando...' : 'Preparando micrófono...'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Example Commands */}
        <div className={`${isDark ? 'bg-[#1E293B]/40 border-[#334155]/50' : 'bg-[#F1F5F9] border-[#E2E8F0]'} rounded-lg p-4 border mt-4`}>
          <p className={`text-xs font-semibold ${textMuted} uppercase tracking-wider mb-3`}>
            Ejemplos de comandos:
          </p>
          <div className={`space-y-2 text-sm ${textSecondary}`}>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#22D3EE]' : 'bg-[#0891B2]'}`}></div>
              <span>"Ejecutar método de Newton"</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#22D3EE]' : 'bg-[#0891B2]'}`}></div>
              <span>"Usar bisección"</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#22D3EE]' : 'bg-[#0891B2]'}`}></div>
              <span>"Calcular Simpson 1/3"</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
