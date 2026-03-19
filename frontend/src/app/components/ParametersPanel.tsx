import { Settings, Play } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ParametersPanelProps {
  selectedMethod: string;
  onCalculate: () => void;
  values: Record<string, string>;
  onValueChange: (name: string, value: string) => void;
}

// Dynamic parameters based on selected method
export const methodParameters: Record<string, Array<{ name: string; label: string; type: string; placeholder: string }>> = {
  'newton': [
    { name: 'x0', label: 'Valor Inicial (x₀)', type: 'number', placeholder: '1.0' },
    { name: 'tolerance', label: 'Tolerancia (ε)', type: 'number', placeholder: '0.0001' },
    { name: 'maxIter', label: 'Iteraciones Máximas', type: 'number', placeholder: '100' },
  ],
  'bisection': [
    { name: 'a', label: 'Límite Inferior (a)', type: 'number', placeholder: '0' },
    { name: 'b', label: 'Límite Superior (b)', type: 'number', placeholder: '2' },
    { name: 'tolerance', label: 'Tolerancia (ε)', type: 'number', placeholder: '0.0001' },
    { name: 'maxIter', label: 'Iteraciones Máximas', type: 'number', placeholder: '100' },
  ],
  'fixed-point': [
    { name: 'x0', label: 'Valor Inicial (x₀)', type: 'number', placeholder: '1.0' },
    { name: 'tolerance', label: 'Tolerancia (ε)', type: 'number', placeholder: '0.0001' },
    { name: 'maxIter', label: 'Iteraciones Máximas', type: 'number', placeholder: '100' },
  ],
  'simpson-1-3': [
    { name: 'a', label: 'Límite Inferior (a)', type: 'number', placeholder: '0' },
    { name: 'b', label: 'Límite Superior (b)', type: 'number', placeholder: '1' },
    { name: 'n', label: 'Número de Subintervalos (n)', type: 'number', placeholder: '10' },
  ],
  'simpson-3-8': [
    { name: 'a', label: 'Limite Inferior (a)', type: 'number', placeholder: '0' },
    { name: 'b', label: 'Limite Superior (b)', type: 'number', placeholder: '1' },
    { name: 'n', label: 'Numero de Subintervalos (n)', type: 'number', placeholder: '12' },
  ],
  'trapezoidal': [
    { name: 'a', label: 'Limite Inferior (a)', type: 'number', placeholder: '0' },
    { name: 'b', label: 'Limite Superior (b)', type: 'number', placeholder: '1' },
    { name: 'n', label: 'Numero de Subintervalos (n)', type: 'number', placeholder: '10' },
  ],
  'rk2': [
    { name: 'x0', label: 'Valor Inicial (x0)', type: 'number', placeholder: '0' },
    { name: 'y0', label: 'Condicion Inicial (y0)', type: 'number', placeholder: '1' },
    { name: 'h', label: 'Tamano de Paso (h)', type: 'number', placeholder: '0.1' },
    { name: 'xf', label: 'Valor Final (xf)', type: 'number', placeholder: '2' },
  ],
  'rk4': [
    { name: 'x0', label: 'Valor Inicial (x0)', type: 'number', placeholder: '0' },
    { name: 'y0', label: 'Condicion Inicial (y0)', type: 'number', placeholder: '1' },
    { name: 'h', label: 'Tamano de Paso (h)', type: 'number', placeholder: '0.1' },
    { name: 'xf', label: 'Valor Final (xf)', type: 'number', placeholder: '2' },
  ],
  'euler': [
    { name: 'x0', label: 'Valor Inicial (x0)', type: 'number', placeholder: '0' },
    { name: 'y0', label: 'Condicion Inicial (y0)', type: 'number', placeholder: '1' },
    { name: 'h', label: 'Tamano de Paso (h)', type: 'number', placeholder: '0.1' },
    { name: 'xf', label: 'Valor Final (xf)', type: 'number', placeholder: '2' },
  ],
  'euler-order': [],
  'verlet': [
    { name: 'x0', label: 'Valor Inicial (x0)', type: 'number', placeholder: '0' },
    { name: 'y0', label: 'Posicion Inicial (y0)', type: 'number', placeholder: '1' },
    { name: 'v0', label: 'Velocidad Inicial (v0)', type: 'number', placeholder: '0' },
    { name: 'h', label: 'Tamano de Paso (h)', type: 'number', placeholder: '0.1' },
    { name: 'xf', label: 'Valor Final (xf)', type: 'number', placeholder: '2' },
  ],
  'verlet-error': [
    { name: 'x0', label: 'Valor Inicial (x0)', type: 'number', placeholder: '0' },
    { name: 'y0', label: 'Posicion Inicial (y0)', type: 'number', placeholder: '1' },
    { name: 'v0', label: 'Velocidad Inicial (v0)', type: 'number', placeholder: '0' },
    { name: 'h', label: 'Tamano de Paso (h)', type: 'number', placeholder: '0.1' },
    { name: 'xf', label: 'Valor Final (xf)', type: 'number', placeholder: '2' },
  ],
  'jacobi': [
    { name: 'matrixA', label: 'Matriz A (fila;fila)', type: 'text', placeholder: '4,1,2;1,3,1;2,1,3' },
    { name: 'vectorB', label: 'Vector b', type: 'text', placeholder: '4,5,6' },
    { name: 'tolerance', label: 'Tolerancia (eps)', type: 'number', placeholder: '0.0001' },
    { name: 'maxIter', label: 'Iteraciones Maximas', type: 'number', placeholder: '100' },
  ],
  'gauss-seidel': [
    { name: 'matrixA', label: 'Matriz A (fila;fila)', type: 'text', placeholder: '4,1,2;1,3,1;2,1,3' },
    { name: 'vectorB', label: 'Vector b', type: 'text', placeholder: '4,5,6' },
    { name: 'tolerance', label: 'Tolerancia (eps)', type: 'number', placeholder: '0.0001' },
    { name: 'maxIter', label: 'Iteraciones Maximas', type: 'number', placeholder: '100' },
    { name: 'matrixA', label: 'Matriz A (fila;fila)', type: 'text', placeholder: '4,1,2;1,3,1;2,1,3' },
    { name: 'vectorB', label: 'Vector b', type: 'text', placeholder: '4,5,6' },
    { name: 'tolerance', label: 'Tolerancia (eps)', type: 'number', placeholder: '0.0001' },
    { name: 'maxIter', label: 'Iteraciones Maximas', type: 'number', placeholder: '100' },
  ],
  'lu': [
    { name: 'matrix_type', label: 'Tipo de Descomposición', type: 'text', placeholder: 'doolittle o crout (por defecto doolittle)' },
    { name: 'matrixA', label: 'Matriz A (fila;fila)', type: 'text', placeholder: '4,1,2;1,3,1;2,1,3' },
    { name: 'vectorB', label: 'Vector b (Opcional)', type: 'text', placeholder: '4,5,6' },
  ],
  'lagrange': [
    { name: 'x_values_str', label: 'Valores x (separados por coma)', type: 'text', placeholder: '1, 2, 3, 4' },
    { name: 'y_values_str', label: 'Valores y (separados por coma)', type: 'text', placeholder: '0.5, 0.8, 0.9, 1.2' },
    { name: 'x_eval', label: 'Valor a Evaluar (x)', type: 'number', placeholder: '2.5' },
  ],
  'newton-divided': [
    { name: 'x_values_str', label: 'Valores x (separados por coma)', type: 'text', placeholder: '1, 2, 3, 4' },
    { name: 'y_values_str', label: 'Valores y (separados por coma)', type: 'text', placeholder: '0.5, 0.8, 0.9, 1.2' },
    { name: 'x_eval', label: 'Valor a Evaluar (x)', type: 'number', placeholder: '2.5' },
  ],
  'cubic-spline': [
    { name: 'x_values_str', label: 'Valores x (separados por coma)', type: 'text', placeholder: '1, 2, 3, 4' },
    { name: 'y_values_str', label: 'Valores y (separados por coma)', type: 'text', placeholder: '0.5, 0.8, 0.9, 1.2' },
    { name: 'x_eval', label: 'Valor a Evaluar (x)', type: 'number', placeholder: '2.5' },
  ],
};

export function ParametersPanel({ selectedMethod, onCalculate, values, onValueChange }: ParametersPanelProps) {
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
        {parameters.map((param, idx) => (
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
              className={`w-full ${bgSecondary} border ${borderSecondary} rounded-lg px-4 py-3 ${textPrimary} ${placeholder} focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all`}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>
        ))}

        {/* Calculate Button */}
        <button
          onClick={onCalculate}
          className="w-full mt-6 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-[#3B82F6]/30 flex items-center justify-center gap-3 group"
        >
          <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Calcular Solución
        </button>
      </div>
    </div>
  );
}
