import React, { useState, useRef, useCallback } from 'react';
import { MethodDetector } from './MethodDetector';
import { VoiceFeedback } from './VoiceFeedback';
import { MethodMeta, ParameterMeta } from './types';
import { useTheme } from '../../context/ThemeContext';

type FlowStep = 
  | 'idle'
  | 'listening_method'
  | 'confirming_method'
  | 'listening_param'
  | 'confirming_param'
  | 'executing'
  | 'done'
  | 'error';

interface ConversationEntry {
  role: 'system' | 'user';
  text: string;
}

function listenOnce(lang = 'es-HN'): Promise<string> {
  return new Promise((resolve, reject) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      reject(new Error('Tu navegador no soporta reconocimiento de voz. Usa Google Chrome.'));
      return;
    }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => resolve(e.results[0][0].transcript);
    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') reject(new Error('No se detectó voz. Intenta de nuevo.'));
      else if (e.error === 'not-allowed') reject(new Error('Permiso de micrófono denegado.'));
      else reject(new Error(`Error: ${e.error}`));
    };
    rec.onend = () => {}; // handled by result/error
    rec.start();
  });
}

export const VoiceNumericalController: React.FC = () => {
  const [step, setStep] = useState<FlowStep>('idle');
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [detectedMethod, setDetectedMethod] = useState<MethodMeta | null>(null);
  const [currentParamIdx, setCurrentParamIdx] = useState(0);
  const [collectedParams, setCollectedParams] = useState<Record<string, any>>({});
  const [ambiguousMethods, setAmbiguousMethods] = useState<MethodMeta[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortRef = useRef(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const addMessage = useCallback((role: 'system' | 'user', text: string) => {
    setConversation(prev => [...prev, { role, text }]);
  }, []);

  const speakAndLog = useCallback(async (text: string) => {
    addMessage('system', text);
    await VoiceFeedback.speak(text);
  }, [addMessage]);

  const cancel = useCallback(() => {
    abortRef.current = true;
    setStep('idle');
    setConversation([]);
    setDetectedMethod(null);
    setCurrentParamIdx(0);
    setCollectedParams({});
    setAmbiguousMethods([]);
    setIsProcessing(false);
    window.speechSynthesis.cancel();
  }, []);

  // ─── Main flow ─────────────────────────────────────────
  const startFlow = useCallback(async () => {
    abortRef.current = false;
    setConversation([]);
    setCollectedParams({});
    setCurrentParamIdx(0);
    setDetectedMethod(null);
    setAmbiguousMethods([]);

    // Step 1: Ask for method
    setStep('listening_method');
    await speakAndLog('¿Qué método quieres usar? Por ejemplo: Bisección, Newton, Simpson.');
    if (abortRef.current) return;

    try {
      const methodText = await listenOnce();
      if (abortRef.current) return;
      addMessage('user', methodText);

      const matched = await MethodDetector.detectMethod(methodText);

      if (!matched) {
        await speakAndLog('No reconocí el método. Intenta decir Bisección, Newton, Lagrange o Simpson.');
        setStep('idle');
        return;
      }

      let selectedMethod: MethodMeta;

      if (Array.isArray(matched)) {
        // Multiple matches — ask user to pick
        setAmbiguousMethods(matched);
        const names = matched.map(m => m.display_name).join(', ');
        await speakAndLog(`Encontré varios métodos: ${names}. Selecciona uno en pantalla.`);
        setStep('confirming_method');
        return; // Flow continues in handleSelectAmbiguous
      } else {
        selectedMethod = matched;
      }

      await proceedWithMethod(selectedMethod);

    } catch (e: any) {
      if (abortRef.current) return;
      addMessage('system', e?.message || 'Error al escuchar');
      setStep('error');
    }
  }, [speakAndLog, addMessage]);

  const proceedWithMethod = useCallback(async (method: MethodMeta) => {
    setDetectedMethod(method);
    setAmbiguousMethods([]);
    await speakAndLog(`Perfecto, usaremos ${method.display_name}.`);
    if (abortRef.current) return;

    const params = method.parameters;
    if (params.length === 0) {
      // No parameters needed, execute directly
      await executeMethod(method, {});
      return;
    }

    // Step 2: Ask each parameter one by one
    const collected: Record<string, any> = {};
    for (let i = 0; i < params.length; i++) {
      if (abortRef.current) return;
      const param = params[i];
      
      if (!param.required && param.default !== undefined && param.default !== '') {
        // Skip optional params with defaults
        collected[param.name] = param.default;
        continue;
      }

      setCurrentParamIdx(i);
      setStep('listening_param');

      const askText = buildParamQuestion(param);
      await speakAndLog(askText);
      if (abortRef.current) return;

      try {
        const answer = await listenOnce();
        if (abortRef.current) return;
        addMessage('user', answer);

        const parsed = parseVoiceValue(param, answer);
        collected[param.name] = parsed;
        setCollectedParams(prev => ({ ...prev, [param.name]: parsed }));

        await speakAndLog(`Entendido: ${parsed}`);
      } catch (e: any) {
        if (abortRef.current) return;
        // Retry once
        await speakAndLog('No te escuché bien. Intenta de nuevo.');
        try {
          const retry = await listenOnce();
          if (abortRef.current) return;
          addMessage('user', retry);
          const parsed = parseVoiceValue(param, retry);
          collected[param.name] = parsed;
          setCollectedParams(prev => ({ ...prev, [param.name]: parsed }));
          await speakAndLog(`Entendido: ${parsed}`);
        } catch {
          await speakAndLog('No pude escucharte. Cancelando.');
          setStep('error');
          return;
        }
      }
    }

    // Step 3: Execute
    await executeMethod(method, collected);
  }, [speakAndLog, addMessage]);

  const executeMethod = useCallback(async (method: MethodMeta, params: Record<string, any>) => {
    setStep('executing');
    setIsProcessing(true);
    await speakAndLog('Calculando, espera un momento...');

    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
      const endpoint = `${API_URL}/api/calculator/calculate`;

      // Build flat payload
      const payload: Record<string, any> = { method: method.id };
      for (const [key, value] of Object.entries(params)) {
        if (value === '' || value === undefined || value === null) continue;
        if (key === 'f' || key === 'f_expr') {
          payload.equation = value;
        } else if (key === 'g_expr') {
          payload.g_equation = value;
        } else {
          payload[key] = value;
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.detail || 'Error en el cálculo');
      }

      const resultData = await res.json();
      await VoiceFeedback.readResult(resultData);
      addMessage('system', `Resultado: ${resultData.result ?? resultData.value ?? 'Ver pantalla'}`);
      setStep('done');

    } catch (e: any) {
      await speakAndLog(e?.message || 'Hubo un error al calcular.');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  }, [speakAndLog, addMessage]);

  const handleSelectAmbiguous = useCallback(async (method: MethodMeta) => {
    setAmbiguousMethods([]);
    await proceedWithMethod(method);
  }, [proceedWithMethod]);

  // ─── Helpers ───────────────────────────────────────────
  function buildParamQuestion(param: ParameterMeta): string {
    const name = param.label || param.name;
    if (param.type === 'function') {
      return `Dime la función. Por ejemplo: x al cuadrado menos 4.`;
    }
    if (param.type === 'vector') {
      return `Dime los valores de ${name}, separados. Por ejemplo: 1, 2, 3.`;
    }
    if (param.type === 'matrix') {
      return `Dime las filas de la matriz ${name}. Di cada fila separada. Por ejemplo: 1, 2, 3, luego 4, 5, 6.`;
    }
    return `¿Cuál es el valor de ${name}?`;
  }

  function parseVoiceValue(param: ParameterMeta, spoken: string): any {
    const cleaned = spoken
      .toLowerCase()
      .replace(/,/g, '.')
      .replace(/\s+/g, ' ')
      .trim();

    if (param.type === 'function') {
      // Convert spoken math to symbolic: "x al cuadrado menos 4" → "x**2 - 4"
      return spokenToMath(spoken);
    }

    if (param.type === 'scalar') {
      // Extract number from speech
      const num = extractNumber(cleaned);
      return num;
    }

    if (param.type === 'vector') {
      // Extract list of numbers
      const parts = cleaned.split(/[,\s]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
      return parts;
    }

    return spoken.trim();
  }

  function spokenToMath(text: string): string {
    let result = text.toLowerCase().trim();
    
    // Common spoken math patterns (Spanish)
    result = result.replace(/x al cuadrado/gi, 'x**2')
      .replace(/x cuadrada/gi, 'x**2')
      .replace(/x al cubo/gi, 'x**3')
      .replace(/x a la (\w+)/gi, (_m, exp) => {
        const nums: Record<string, string> = { 'segunda': '2', 'tercera': '3', 'cuarta': '4', 'quinta': '5' };
        return `x**${nums[exp] || exp}`;
      })
      .replace(/raíz de x/gi, 'sqrt(x)')
      .replace(/raiz de x/gi, 'sqrt(x)')
      .replace(/seno de x/gi, 'sin(x)')
      .replace(/coseno de x/gi, 'cos(x)')
      .replace(/tangente de x/gi, 'tan(x)')
      .replace(/logaritmo de x/gi, 'log(x)')
      .replace(/e a la x/gi, 'exp(x)')
      .replace(/más/gi, '+')
      .replace(/menos/gi, '-')
      .replace(/por/gi, '*')
      .replace(/entre/gi, '/')
      .replace(/dividido/gi, '/')
      .replace(/punto/gi, '.')
      .replace(/coma/gi, '.')
      .trim();

    return result;
  }

  function extractNumber(text: string): number {
    // Try direct parse first
    const direct = parseFloat(text.replace(/[^0-9.\-]/g, ''));
    if (!isNaN(direct)) return direct;

    // Map spoken numbers
    const numberWords: Record<string, number> = {
      'cero': 0, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
      'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
      'veinte': 20, 'treinta': 30, 'cien': 100, 'mil': 1000,
      'menos uno': -1, 'menos dos': -2,
    };

    for (const [word, num] of Object.entries(numberWords)) {
      if (text.includes(word)) return num;
    }

    return parseFloat(text) || 0;
  }

  // ─── Render ────────────────────────────────────────────
  const isActive = step !== 'idle';

  return (
    <>
      {/* Conversation panel */}
      {isActive && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-[#0F172A] border border-[#1E293B]' : 'bg-white border border-[#E2E8F0]'}`}>
            {/* Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-[#1E293B] bg-gradient-to-r from-[#1E293B] to-[#0F172A]' : 'border-[#E2E8F0] bg-gradient-to-r from-[#F1F5F9] to-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${step === 'listening_method' || step === 'listening_param' ? 'bg-red-500 animate-pulse' : step === 'executing' ? 'bg-yellow-500 animate-pulse' : step === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <h3 className={`font-semibold text-sm ${isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
                  {step === 'listening_method' || step === 'listening_param' ? '🎙️ Escuchando...' :
                   step === 'executing' ? '⏳ Calculando...' :
                   step === 'done' ? '✅ Listo' :
                   step === 'error' ? '❌ Error' :
                   '🔊 Asistente de Voz'}
                </h3>
              </div>
              <button onClick={cancel} className={`px-3 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-[#1E293B] text-[#94A3B8] hover:text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'} transition-colors`}>
                Cancelar
              </button>
            </div>

            {/* Conversation log */}
            <div className="max-h-72 overflow-y-auto p-4 space-y-3">
              {conversation.map((entry, i) => (
                <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm ${
                    entry.role === 'user'
                      ? 'bg-[#3B82F6] text-white rounded-br-md'
                      : isDark ? 'bg-[#1E293B] text-[#E2E8F0] rounded-bl-md' : 'bg-[#F1F5F9] text-[#334155] rounded-bl-md'
                  }`}>
                    {entry.text}
                  </div>
                </div>
              ))}
              {(step === 'listening_method' || step === 'listening_param') && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-500'}`}>Escuchando...</span>
                  </div>
                </div>
              )}
              {isProcessing && (
                <div className="flex justify-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-[#1E293B]' : 'bg-[#F1F5F9]'}`}>
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Calculando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ambiguous method selection */}
            {ambiguousMethods.length > 0 && (
              <div className={`px-4 pb-4 border-t ${isDark ? 'border-[#1E293B]' : 'border-[#E2E8F0]'} pt-3`}>
                <p className={`text-xs font-medium mb-2 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Selecciona el método:</p>
                <div className="flex flex-wrap gap-2">
                  {ambiguousMethods.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectAmbiguous(m)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-[#1E293B] text-[#E2E8F0] hover:bg-[#334155]' : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'}`}
                    >
                      {m.display_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Done / Error footer */}
            {(step === 'done' || step === 'error') && (
              <div className={`px-4 pb-4 border-t pt-3 ${isDark ? 'border-[#1E293B]' : 'border-[#E2E8F0]'}`}>
                <div className="flex gap-2">
                  <button
                    onClick={startFlow}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white hover:from-[#2563EB] hover:to-[#1D4ED8] transition-all"
                  >
                    Nuevo cálculo
                  </button>
                  <button
                    onClick={cancel}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold ${isDark ? 'bg-[#1E293B] text-[#94A3B8]' : 'bg-[#F1F5F9] text-[#64748B]'} transition-colors`}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating mic button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={isActive ? cancel : startFlow}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-105 outline-none ${
            isActive
              ? 'bg-red-500 animate-pulse ring-4 ring-red-200'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/50'
          } text-white`}
          title={isActive ? 'Cancelar' : 'Comando de voz'}
        >
          {isActive ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
          )}
        </button>
      </div>
    </>
  );
};
