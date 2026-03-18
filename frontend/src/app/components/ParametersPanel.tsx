import { useState } from 'react';
import { Settings, Play, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ParametersPanelProps {
  selectedMethod: string;
  onCalculate: () => void;
  values: Record<string, string>;
  onValueChange: (name: string, value: string) => void;
  apiError?: string | null;
  isLoading?: boolean;
}

// Help text per method — tells the user what to do
const methodHelp: Record<string, string> = {
  'newton': 'Escribe f(x) en el editor (ej: x**2 - 4) y opcionalmente un valor inicial.',
  'bisection': 'Escribe f(x) en el editor y define el intervalo [a, b] donde cambia de signo.',
  'fixed-point': 'Escribe g(x) en el editor (la función de iteración) y un valor inicial.',
  'convergence': 'Escribe g(x) en el editor para verificar si el punto fijo converge.',
  'simpson-1-3': 'Escribe f(x) en el editor y define el intervalo [a, b] y número de subintervalos (par).',
  'simpson-3-8': 'Escribe f(x) en el editor y define el intervalo [a, b] y número de subintervalos (múltiplo de 3).',
  'trapezoidal': 'Escribe f(x) en el editor y define el intervalo [a, b] y número de subintervalos.',
  'euler': 'Escribe f(x, y) en el editor (ej: x + y). Define x₀, y₀, paso h y valor final xf.',
  'rk2': 'Escribe f(x, y) en el editor (ej: x + y). Define x₀, y₀, paso h y valor final xf.',
  'rk4': 'Escribe f(x, y) en el editor (ej: x + y). Define x₀, y₀, paso h y valor final xf.',
  'euler-order': 'No requiere parámetros. Muestra el orden del método de Euler (global=1, local=2).',
  'verlet': 'Escribe f(x, y) en el editor. Define x₀, y₀, v₀, paso h y valor final xf.',
  'verlet-error': 'Escribe f(x, y) en el editor. Define x₀, y₀, v₀, paso h y valor final xf.',
  'jacobi': 'Ingresa la Matriz A separando filas con ";" y columnas con "," (ej: 4,1,2;1,3,1;2,1,3). Ingresa el Vector b separado por comas.',
  'gauss-seidel': 'Ingresa la Matriz A separando filas con ";" y columnas con "," (ej: 4,1,2;1,3,1;2,1,3). Ingresa el Vector b separado por comas.',
  'lagrange': 'Ingresa los puntos conocidos: valores de X y Y separados por comas. Opcionalmente, un valor de X para evaluar.',
  'newton-interpolation': 'Ingresa los puntos conocidos: valores de X y Y separados por comas.',
  'polynomial': 'Ingresa los puntos conocidos: valores de X y Y separados por comas.',
  'cubic-spline': 'Ingresa los puntos conocidos: valores de X y Y separados por comas.',
};

// Dynamic parameters based on selected method
const methodParameters: Record<string, Array<{name: string; label: string; type: string; placeholder: string; required?: boolean; helpText?: string}>> = {
  'newton': [
    { name: 'x0', label: 'Valor Inicial (x₀)', type: 'number', placeholder: '1.0', helpText: 'Punto de partida para buscar la raíz' },
    { name: 'tolerance', label: 'Tolerancia (ε)', type: 'number', placeholder: '0.0001' },
    { name: 'maxIter', label: 'Iteraciones Máximas', type: 'number', placeholder: '100' },
  ],
  'bisection': [
    { name: 'a', label: 'Límite Inferior (a)', type: 'number', placeholder: '0', required: true, helpText: 'Inicio del intervalo donde f(a) y f(b) tienen signo opuesto' },
    { name: 'b', label: 'Límite Superior (b)', type: 'number', placeholder: '2', required: true, helpText: 'Fin del intervalo' },
    { name: 'tolerance', label: 'Tolerancia (ε)', type: 'number', placeholder: '0.0001' },
    { name: 'maxIter', label: 'Iteraciones Máximas', type: 'number', placeholder: '100' },
  ],
  'fixed-point': [
    { name: 'x0', label: 'Valor Inicial (x₀)', type: 'number', placeholder: '1.0', helpText: 'Punto de partida para la iteración' },
    { name: 'tolerance', label: 'Tolerancia (ε)', type: 'number', placeholder: '0.0001' },
    { name: 'maxIter', label: 'Iteraciones Máximas', type: 'number', placeholder: '100' },
  ],
  'simpson-1-3': [
    { name: 'a', label: 'Límite Inferior (a)', type: 'number', placeholder: '0', required: true },
    { name: 'b', label: 'Límite Superior (b)', type: 'number', placeholder: '1', required: true },
    { name: 'n', label: 'Subintervalos (n)', type: 'number', placeholder: '10', required: true, helpText: 'Debe ser un número par' },
  ],
  'simpson-3-8': [
    { name: 'a', label: 'Límite Inferior (a)', type: 'number', placeholder: '0', required: true },
    { name: 'b', label: 'Límite Superior (b)', type: 'number', placeholder: '1', required: true },
    { name: 'n', label: 'Subintervalos (n)', type: 'number', placeholder: '12', required: true, helpText: 'Debe ser múltiplo de 3' },
  ],
  'trapezoidal': [
    { name: 'a', label: 'Límite Inferior (a)', type: 'number', placeholder: '0', required: true },
    { name: 'b', label: 'Límite Superior (b)', type: 'number', placeholder: '1', required: true },
    { name: 'n', label: 'Subintervalos (n)', type: 'number', placeholder: '10', required: true },
  ],
  'rk2': [
    { name: 'x0', label: 'x₀ (inicio)', type: 'number', placeholder: '0', required: true },
    { name: 'y0', label: 'y₀ (condición inicial)', type: 'number', placeholder: '1', required: true },
    { name: 'h', label: 'Paso (h)', type: 'number', placeholder: '0.1', required: true },
    { name: 'xf', label: 'xf (valor final)', type: 'number', placeholder: '2', required: true },
  ],
  'rk4': [
    { name: 'x0', label: 'x₀ (inicio)', type: 'number', placeholder: '0', required: true },
    { name: 'y0', label: 'y₀ (condición inicial)', type: 'number', placeholder: '1', required: true },
    { name: 'h', label: 'Paso (h)', type: 'number', placeholder: '0.1', required: true },
    { name: 'xf', label: 'xf (valor final)', type: 'number', placeholder: '2', required: true },
  ],
  'euler': [
    { name: 'x0', label: 'x₀ (inicio)', type: 'number', placeholder: '0', required: true },
    { name: 'y0', label: 'y₀ (condición inicial)', type: 'number', placeholder: '1', required: true },
    { name: 'h', label: 'Paso (h)', type: 'number', placeholder: '0.1', required: true },
    { name: 'xf', label: 'xf (valor final)', type: 'number', placeholder: '2', required: true },
  ],
  'euler-order': [],
  'verlet': [
    { name: 'x0', label: 'x₀ (inicio)', type: 'number', placeholder: '0', required: true },
    { name: 'y0', label: 'y₀ (posición inicial)', type: 'number', placeholder: '1', required: true },
    { name: 'v0', label: 'v₀ (velocidad inicial)', type: 'number', placeholder: '0', required: true },
    { name: 'h', label: 'Paso (h)', type: 'number', placeholder: '0.1', required: true },
    { name: 'xf', label: 'xf (valor final)', type: 'number', placeholder: '2', required: true },
  ],
  'verlet-error': [
    { name: 'x0', label: 'x₀ (inicio)', type: 'number', placeholder: '0', required: true },
    { name: 'y0', label: 'y₀ (posición inicial)', type: 'number', placeholder: '1', required: true },
    { name: 'v0', label: 'v₀ (velocidad inicial)', type: 'number', placeholder: '0', required: true },
    { name: 'h', label: 'Paso (h)', type: 'number', placeholder: '0.1', required: true },
    { name: 'xf', label: 'xf (valor final)', type: 'number', placeholder: '2', required: true },
  ],
  'jacobi': [
    { name: 'matrixA', label: 'Matriz A', type: 'text', placeholder: '4,1,2;1,3,1;2,1,3', required: true, helpText: 'Filas separadas por ";" y columnas por ","' },
    { name: 'vectorB', label: 'Vector b', type: 'text', placeholder: '4,5,6', required: true, helpText: 'Valores separados por comas' },
    { name: 'tolerance', label: 'Tolerancia', type: 'number', placeholder: '0.0001' },
    { name: 'maxIter', label: 'Iteraciones Máximas', type: 'number', placeholder: '100' },
  ],
  'gauss-seidel': [
    { name: 'matrixA', label: 'Matriz A', type: 'text', placeholder: '4,1,2;1,3,1;2,1,3', required: true, helpText: 'Filas separadas por ";" y columnas por ","' },
    { name: 'vectorB', label: 'Vector b', type: 'text', placeholder: '4,5,6', required: true, helpText: 'Valores separados por comas' },
    { name: 'tolerance', label: 'Tolerancia', type: 'number', placeholder: '0.0001' },
    { name: 'maxIter', label: 'Iteraciones Máximas', type: 'number', placeholder: '100' },
  ],
  'lagrange': [
    { name: 'x_values', label: 'Valores de X', type: 'text', placeholder: '1,2,3,4', required: true, helpText: 'Puntos conocidos separados por comas' },
    { name: 'y_values', label: 'Valores de Y', type: 'text', placeholder: '1,4,9,16', required: true, helpText: 'Valores correspondientes separados por comas' },
    { name: 'x_eval', label: 'Evaluar en X', type: 'number', placeholder: '2.5', helpText: 'Punto donde evaluar el polinomio' },
  ],
  'newton-interpolation': [
    { name: 'x_values', label: 'Valores de X', type: 'text', placeholder: '1,2,3,4', required: true, helpText: 'Puntos conocidos separados por comas' },
    { name: 'y_values', label: 'Valores de Y', type: 'text', placeholder: '1,4,9,16', required: true },
    { name: 'x_eval', label: 'Evaluar en X', type: 'number', placeholder: '2.5' },
  ],
  'polynomial': [
    { name: 'x_values', label: 'Valores de X', type: 'text', placeholder: '1,2,3,4', required: true },
    { name: 'y_values', label: 'Valores de Y', type: 'text', placeholder: '1,4,9,16', required: true },
    { name: 'x_eval', label: 'Evaluar en X', type: 'number', placeholder: '2.5' },
  ],
  'cubic-spline': [
    { name: 'x_values', label: 'Valores de X', type: 'text', placeholder: '1,2,3,4', required: true },
    { name: 'y_values', label: 'Valores de Y', type: 'text', placeholder: '1,4,9,16', required: true },
    { name: 'x_eval', label: 'Evaluar en X', type: 'number', placeholder: '2.5' },
  ],
};

export function ParametersPanel({ selectedMethod, onCalculate, values, onValueChange, apiError, isLoading }: ParametersPanelProps) {
  const parameters = methodParameters[selectedMethod] || methodParameters['newton'];
  const helpText = methodHelp[selectedMethod] || '';
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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

  const handleCalculateClick = () => {
    const errors: Record<string, string> = {};

    parameters.forEach((param) => {
      if (param.required && (!values[param.name] || values[param.name].trim() === '')) {
        errors[param.name] = `Este campo es obligatorio`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onCalculate();
  };

  const handleValueChange = (name: string, value: string) => {
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    onValueChange(name, value);
  };

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
        {/* Method instructions for the user */}
        {helpText && (
          <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-lg ${isDark ? 'bg-blue-500/8 border border-blue-500/15' : 'bg-blue-50 border border-blue-100'}`}>
            <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            <p className={`text-xs leading-relaxed ${isDark ? 'text-blue-300/90' : 'text-blue-600'}`}>
              {helpText}
            </p>
          </div>
        )}

        {/* Parameter inputs */}
        {parameters.map((param, idx) => {
          const hasError = !!fieldErrors[param.name];
          const borderColor = hasError
            ? (isDark ? 'border-red-500/50 focus:border-red-400' : 'border-red-400 focus:border-red-500')
            : `${borderSecondary} focus:border-[#3B82F6]`;

          return (
            <div key={idx}>
              <label className={`block text-sm font-medium ${textTertiary} mb-1.5`}>
                {param.label}
                {param.required && (
                  <span className={`ml-1 ${isDark ? 'text-red-400' : 'text-red-500'}`}>*</span>
                )}
              </label>
              {param.helpText && !hasError && (
                <p className={`text-xs ${textSecondary} mb-1.5`}>{param.helpText}</p>
              )}
              <input
                type={param.type}
                placeholder={param.placeholder}
                value={values[param.name] ?? ''}
                onChange={(e) => handleValueChange(param.name, e.target.value)}
                step={param.type === 'number' ? '0.0001' : undefined}
                className={`w-full ${bgSecondary} border ${borderColor} rounded-lg px-4 py-3 ${textPrimary} ${placeholder} focus:outline-none focus:ring-2 ${hasError ? 'focus:ring-red-500/20' : 'focus:ring-[#3B82F6]/20'} transition-all`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
              {hasError && (
                <p className={`mt-1 text-xs flex items-center gap-1 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {fieldErrors[param.name]}
                </p>
              )}
            </div>
          );
        })}

        {/* API Error — shown RIGHT HERE, near the button, not at the bottom */}
        {apiError && (
          <div className={`flex items-start gap-3 px-4 py-3 rounded-xl ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'} animate-[pulse_0.5s_ease-in-out_1]`}>
            <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                Error
              </p>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-red-300/80' : 'text-red-500'}`}>
                {apiError}
              </p>
            </div>
          </div>
        )}

        {/* Calculate Button */}
        <button
          onClick={handleCalculateClick}
          disabled={isLoading}
          className={`w-full mt-4 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-[#3B82F6]/30 flex items-center justify-center gap-3 group ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Calcular Solución
            </>
          )}
        </button>
      </div>
    </div>
  );
}
