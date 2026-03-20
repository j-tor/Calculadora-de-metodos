import { Settings, Play, Mic } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { MatrixVectorInputs } from './MatrixVectorInputs';
import { methodParameters } from '../config/methodParameters';

export { methodParameters };

const MATRIX_METHODS = new Set(['jacobi', 'gauss-seidel', 'lu']);

interface ParametersPanelProps {
  selectedMethod: string;
  onCalculate: () => void;
  onVoiceCommand?: () => void;
  values: Record<string, string>;
  onValueChange: (name: string, value: string) => void;
  fieldErrors?: Record<string, string>;
}

export function ParametersPanel({ selectedMethod, onCalculate, onVoiceCommand, values, onValueChange, fieldErrors }: ParametersPanelProps) {
  const parameters = methodParameters[selectedMethod] || methodParameters['newton'];
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bgPrimary = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const bgSecondary = isDark ? 'bg-[#1E293B]' : 'bg-[#F1F5F9]';
  const bgGradient = isDark ? 'from-[#1E293B] to-[#334155]/50' : 'from-[#E2E8F0] to-[#F1F5F9]';
  const textPrimary = isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]';
  const textSecondary = isDark ? 'text-[#94A3B8]' : 'text-[#475569]';
  const textTertiary = isDark ? 'text-[#CBD5E1]' : 'text-[#334155]';
  const border = isDark ? 'border-[#1E293B]' : 'border-[#E2E8F0]';
  const borderSecondary = isDark ? 'border-[#334155]' : 'border-[#CBD5E1]';
  const placeholder = isDark ? 'placeholder-[#64748B]' : 'placeholder-[#94A3B8]';

  return (
    <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}>
      <div className={`bg-gradient-to-r ${bgGradient} px-6 py-4 border-b ${borderSecondary}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-[#22D3EE]/10' : 'bg-[#0891B2]/10'}`}>
            <Settings className={`w-5 h-5 ${isDark ? 'text-[#22D3EE]' : 'text-[#0891B2]'}`} />
          </div>
          <div>
            <h3 className={`text-base font-semibold ${textPrimary}`}>Parámetros del Método</h3>
            <p className={`text-sm ${textSecondary} mt-0.5`}>
              Configure los valores requeridos
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {parameters.map((param, idx) => {
          if (MATRIX_METHODS.has(selectedMethod) && param.name === 'matrixA') {
            return (
              <div key="matrix-vector-editor">
                <label className={`block text-sm font-medium ${textTertiary} mb-2`}>
                  Matriz A y vector b
                </label>
                <MatrixVectorInputs
                  matrixStr={values.matrixA ?? ''}
                  vectorStr={values.vectorB ?? ''}
                  onMatrixChange={(s) => onValueChange('matrixA', s)}
                  onVectorChange={(s) => onValueChange('vectorB', s)}
                  optionalVector={selectedMethod === 'lu'}
                  matrixError={fieldErrors?.matrixA}
                  vectorError={fieldErrors?.vectorB}
                />
              </div>
            );
          }
          if (MATRIX_METHODS.has(selectedMethod) && param.name === 'vectorB') {
            return null;
          }
          const err = fieldErrors?.[param.name];
          return (
            <div key={idx}>
              <label className={`block text-sm font-medium ${textTertiary} mb-2`}>
                {param.label}
              </label>
              <input
                type={param.type}
                placeholder={param.placeholder}
                value={values[param.name] ?? ''}
                onChange={(e) => onValueChange(param.name, e.target.value)}
                step={param.type === 'number' ? '0.0001' : undefined}
                aria-invalid={!!err}
                className={`w-full ${bgSecondary} border ${err ? 'border-red-500 ring-2 ring-red-500/25' : borderSecondary} rounded-lg px-4 py-3 ${textPrimary} ${placeholder} focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
              {err ? (
                <p className="text-red-500 text-xs mt-1.5" role="alert">
                  {err}
                </p>
              ) : null}
            </div>
          );
        })}

        {/* Calculate and Voice Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCalculate}
            className="flex-1 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-[#3B82F6]/30 flex items-center justify-center gap-3 group"
          >
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Calcular Solución
          </button>
          {onVoiceCommand && (
            <button
              onClick={onVoiceCommand}
              className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-semibold py-4 px-5 rounded-xl transition-all shadow-lg shadow-[#8B5CF6]/30 flex items-center justify-center gap-2 group min-w-[60px]"
              title="Comando de Voz"
            >
              <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
