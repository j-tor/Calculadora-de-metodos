import React, { useState } from 'react';
import { VoiceRecognizer } from './VoiceRecognizer';
import { DynamicFormBuilder } from './DynamicFormBuilder';
import { MethodDetector } from './MethodDetector';
import { VoiceFeedback } from './VoiceFeedback';
import { VoiceFlowState, MethodMeta } from './types';

export const VoiceNumericalController: React.FC = () => {
  const [state, setState] = useState<VoiceFlowState>({
    status: 'idle',
    detectedMethod: null,
    collectedParams: {},
    result: null
  });
  
  const [ambiguousMethods, setAmbiguousMethods] = useState<MethodMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const startListening = async () => {
    await VoiceFeedback.init();
    setState(prev => ({ ...prev, status: 'listening', result: null }));
  };

  const handleTranscript = async (text: string) => {
    setState(prev => ({ ...prev, status: 'idle' }));
    const matched = await MethodDetector.detectMethod(text);
    
    if (!matched) {
      await VoiceFeedback.speak("No reconocí el método. Intenta decir Bisección, Newton o Gauss.");
      return;
    }

    if (Array.isArray(matched)) {
      setAmbiguousMethods(matched);
      const names = matched.map(m => m.display_name).join(" o ");
      await VoiceFeedback.speak(`Encontré varios métodos. ¿Te refieres a ${names}?`);
    } else {
      await VoiceFeedback.confirmMethod(matched.display_name);
      setState({
        status: 'collecting',
        detectedMethod: matched,
        collectedParams: {},
        result: null
      });
      if (matched.parameters.length > 0) {
        await VoiceFeedback.askParameter(matched.parameters[0].label);
      }
    }
  };

  const handleSelectAmbiguous = async (method: MethodMeta) => {
    setAmbiguousMethods([]);
    await VoiceFeedback.confirmMethod(method.display_name);
    setState({
      status: 'collecting',
      detectedMethod: method,
      collectedParams: {},
      result: null
    });
    if (method.parameters.length > 0) {
      await VoiceFeedback.askParameter(method.parameters[0].label);
    }
  };

  const handleFormSubmit = async (values: Record<string, any>) => {
    if (!state.detectedMethod) return;
    
    setState(prev => ({ ...prev, status: 'executing' }));
    setIsLoading(true);

    try {
      // Intenta usar el endpoint existente de cálculo asumiendo la estructura
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const endpoint = `${API_URL}/api/calculate`; 
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: state.detectedMethod.id,
          params: values
        })
      });

      if (!res.ok) {
        throw new Error("Error en la petición de cálculo");
      }
      
      const resultData = await res.json();
      
      setState(prev => ({
        ...prev,
        status: 'done',
        result: resultData
      }));
      
      await VoiceFeedback.readResult(resultData);
      
    } catch (e: any) {
      console.error(e);
      await VoiceFeedback.readError("Hubo un problema al ejecutar el método.");
      setState(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setState({ status: 'idle', detectedMethod: null, collectedParams: {}, result: null });
    setAmbiguousMethods([]);
  };

  const renderResult = () => {
    if (!state.result) return null;
    const { value, iterations, error, details, table } = state.result;
    
    return (
      <div className="bg-white p-5 rounded-lg shadow-xl border border-green-200 w-96 text-black max-h-[80vh] overflow-y-auto">
        <h4 className="font-bold text-green-700 mb-3 border-b pb-1 text-lg">Resultado</h4>
        
        <div className="mb-4">
          <span className="block text-sm text-gray-500 font-semibold mb-1">Valor Final:</span>
          <div className="font-mono bg-gray-50 p-3 rounded border text-lg overflow-x-auto">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          {iterations !== undefined && (
            <div className="flex-1 bg-blue-50 p-2 rounded border border-blue-100">
              <span className="block text-xs text-blue-600 font-bold uppercase">Iteraciones</span>
              <span className="text-lg font-mono">{iterations}</span>
            </div>
          )}
          {error !== undefined && (
            <div className="flex-1 bg-red-50 p-2 rounded border border-red-100">
              <span className="block text-xs text-red-600 font-bold uppercase">Error</span>
              <span className="text-lg font-mono">{error}</span>
            </div>
          )}
        </div>
        
        {/* If the backend returns a table array for iterations steps */}
        {Array.isArray(table) && table.length > 0 && (
          <div className="mt-4">
            <h5 className="font-semibold text-sm mb-2 text-gray-700">Tabla de Iteraciones:</h5>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                     {Object.keys(table[0]).map(k => <th key={k} className="p-1">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {table.map((row: any, i: number) => (
                    <tr key={i} className="border-b">
                      {Object.values(row).map((val: any, j: number) => (
                        <td key={j} className="p-1">{typeof val === 'number' ? val.toPrecision(6) : val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button onClick={handleCancel} className="mt-4 bg-gray-800 text-white w-full py-2 rounded font-semibold hover:bg-gray-900 transition-colors">
          Cerrar
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        
        {state.status === 'collecting' && state.detectedMethod && (
          <DynamicFormBuilder 
            parameters={state.detectedMethod.parameters}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        )}

        {ambiguousMethods.length > 0 && (
           <div className="bg-white p-5 rounded-lg shadow-xl border border-blue-200 w-80">
             <h4 className="font-bold text-gray-800 mb-3 text-lg">Múltiples métodos encontrados</h4>
             <p className="text-sm text-gray-600 mb-3">Por favor selecciona el que deseas:</p>
             <div className="flex flex-col gap-2">
               {ambiguousMethods.map(m => (
                 <button 
                   key={m.id}
                   className="bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded text-left font-medium transition-colors"
                   onClick={() => handleSelectAmbiguous(m)}
                 >
                   {m.display_name}
                 </button>
               ))}
               <button onClick={handleCancel} className="mt-2 text-gray-500 hover:text-gray-700 text-sm font-medium py-1">Cancelar</button>
             </div>
           </div>
        )}

        {state.status === 'done' && renderResult()}

        {isLoading && (
          <div className="bg-white px-5 py-3 rounded-full shadow-xl flex items-center gap-3 border border-gray-100">
             <div className="w-5 h-5 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             <span className="font-medium text-gray-700 block">Calculando...</span>
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={state.status === 'listening' ? handleCancel : startListening}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-105 outline-none ${
            state.status === 'listening' ? 'bg-red-500 animate-pulse ring-4 ring-red-200' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/50'
          } text-white`}
          title={state.status === 'listening' ? 'Cancelar escucha' : 'Hablar comando'}
        >
          {state.status === 'listening' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
          )}
        </button>

        <VoiceRecognizer 
          isListening={state.status === 'listening'}
          onTranscript={handleTranscript}
        />
      </div>
    </>
  );
};
