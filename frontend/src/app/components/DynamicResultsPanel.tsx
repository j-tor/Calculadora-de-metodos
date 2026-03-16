import { CheckCircle2, AlertCircle, TrendingUp, Hash, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface DynamicResultsPanelProps {
  selectedMethod: string;
  hasResults: boolean;
}

// Mock results - in real app, these would come from calculation
const mockResults: Record<string, Array<{label: string; value: string; icon: any; color: string}>> = {
  'newton': [
    { label: 'Raíz Encontrada', value: '2.0938', icon: CheckCircle2, color: 'cyan' },
    { label: 'Iteraciones', value: '6', icon: Hash, color: 'blue' },
    { label: 'Error Absoluto', value: '0.0149', icon: TrendingUp, color: 'cyan' },
    { label: 'Error Relativo', value: '0.71%', icon: AlertCircle, color: 'blue' },
  ],
  'bisection': [
    { label: 'Raíz Aproximada', value: '2.0938', icon: CheckCircle2, color: 'cyan' },
    { label: 'Iteraciones', value: '14', icon: Hash, color: 'blue' },
    { label: 'Intervalo Final', value: '[2.093, 2.094]', icon: Info, color: 'cyan' },
    { label: 'Error', value: '0.0005', icon: TrendingUp, color: 'blue' },
  ],
  'rk4': [
    { label: 'Valor Final y(xf)', value: '7.3891', icon: CheckCircle2, color: 'cyan' },
    { label: 'Pasos Calculados', value: '20', icon: Hash, color: 'blue' },
    { label: 'Tamaño de Paso', value: '0.1', icon: Info, color: 'cyan' },
  ],
  'simpson-1-3': [
    { label: 'Integral Aproximada', value: '0.3333', icon: CheckCircle2, color: 'cyan' },
    { label: 'Subintervalos', value: '10', icon: Hash, color: 'blue' },
    { label: 'Error Estimado', value: '< 0.0001', icon: TrendingUp, color: 'cyan' },
  ],
  'simpson-3-8': [
    { label: 'Integral Aproximada', value: '0.3333', icon: CheckCircle2, color: 'cyan' },
    { label: 'Subintervalos', value: '12', icon: Hash, color: 'blue' },
    { label: 'Error Estimado', value: '< 0.0001', icon: TrendingUp, color: 'cyan' },
  ],
  'trapezoidal': [
    { label: 'Integral Aproximada', value: '0.3333', icon: CheckCircle2, color: 'cyan' },
    { label: 'Subintervalos', value: '12', icon: Hash, color: 'blue' },
    { label: 'Error Estimado', value: '< 0.001', icon: TrendingUp, color: 'blue' },
  ],
  'rk2': [
    { label: 'Valor Final y(xf)', value: '7.3891', icon: CheckCircle2, color: 'cyan' },
    { label: 'Pasos Calculados', value: '20', icon: Hash, color: 'blue' },
    { label: 'Tamano de Paso', value: '0.1', icon: Info, color: 'cyan' },
  ],
  'euler': [
    { label: 'Valor Final y(xf)', value: '6.7275', icon: CheckCircle2, color: 'cyan' },
    { label: 'Pasos Calculados', value: '20', icon: Hash, color: 'blue' },
    { label: 'Tamano de Paso', value: '0.1', icon: Info, color: 'cyan' },
  ],
  'euler-order': [
    { label: 'Orden Global', value: '1', icon: CheckCircle2, color: 'cyan' },
    { label: 'Orden Local', value: '2', icon: Info, color: 'blue' },
  ],
  'verlet': [
    { label: 'Posicion Final', value: '0.9093', icon: CheckCircle2, color: 'cyan' },
    { label: 'Pasos Calculados', value: '20', icon: Hash, color: 'blue' },
    { label: 'Tamano de Paso', value: '0.1', icon: Info, color: 'cyan' },
  ],
  'verlet-error': [
    { label: 'Error Estimado', value: '0.0003', icon: TrendingUp, color: 'cyan' },
  ],
  'jacobi': [
    { label: 'Iteraciones', value: '18', icon: Hash, color: 'blue' },
    { label: 'Convergio', value: 'Si', icon: CheckCircle2, color: 'cyan' },
  ],
  'gauss-seidel': [
    { label: 'Iteraciones', value: '9', icon: Hash, color: 'blue' },
    { label: 'Convergio', value: 'Si', icon: CheckCircle2, color: 'cyan' },
  ],
  'lu': [
    { label: 'Solucion', value: 'x1=1.0, x2=2.0', icon: CheckCircle2, color: 'cyan' },
  ],
  'lagrange': [
    { label: 'Valor Interpolado', value: '2.375', icon: CheckCircle2, color: 'cyan' },
  ],
  'newton-divided': [
    { label: 'Valor Interpolado', value: '2.375', icon: CheckCircle2, color: 'cyan' },
  ],
};

const mockIterations = [
  { iteration: 0, xi: 1.0000, fxi: -6.0000, error: 0.0000 },
  { iteration: 1, xi: 2.0000, fxi: -1.0000, error: 0.5000 },
  { iteration: 2, xi: 2.5000, fxi: 5.6250, error: 0.2000 },
  { iteration: 3, xi: 2.2500, fxi: 1.8906, error: 0.1111 },
  { iteration: 4, xi: 2.1250, fxi: 0.3457, error: 0.0588 },
  { iteration: 5, xi: 2.0625, fxi: -0.3516, error: 0.0303 },
  { iteration: 6, xi: 2.0938, fxi: -0.0096, error: 0.0149 },
];

export function DynamicResultsPanel({ selectedMethod, hasResults }: DynamicResultsPanelProps) {
  const [showTable, setShowTable] = useState(false);
  const results = mockResults[selectedMethod] || mockResults['newton'];
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bgPrimary = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const bgSecondary = isDark ? 'bg-[#1E293B]' : 'bg-[#F1F5F9]';
  const bgGradient = isDark ? 'from-[#1E293B] to-[#334155]/50' : 'from-[#E2E8F0] to-[#F1F5F9]';
  const bgHover = isDark ? 'hover:from-[#334155]/60 hover:to-[#334155]/40' : 'hover:from-[#CBD5E1] hover:to-[#E2E8F0]';
  const bgTableRow = isDark ? 'bg-[#1E293B]/60' : 'bg-[#F1F5F9]';
  const bgTableHover = isDark ? 'hover:bg-[#1E293B]/40' : 'hover:bg-[#E2E8F0]';
  const textPrimary = isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]';
  const textSecondary = isDark ? 'text-[#94A3B8]' : 'text-[#475569]';
  const textTertiary = isDark ? 'text-[#CBD5E1]' : 'text-[#334155]';
  const textMuted = isDark ? 'text-[#64748B]' : 'text-[#64748B]';
  const border = isDark ? 'border-[#1E293B]' : 'border-[#E2E8F0]';
  const borderSecondary = isDark ? 'border-[#334155]' : 'border-[#CBD5E1]';

  if (!hasResults) {
    return (
      <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl p-12 text-center`}>
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${isDark ? 'bg-[#1E293B]/60' : 'bg-[#F1F5F9]'} flex items-center justify-center`}>
          <Info className={`w-10 h-10 ${textMuted}`} />
        </div>
        <h3 className={`text-lg font-semibold ${textTertiary} mb-2`}>Sin Resultados</h3>
        <p className={`text-sm ${textMuted}`}>
          Configure los parámetros y presione "Calcular Solución" para ver los resultados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dynamic Result Cards */}
      <div className={`grid gap-4 ${results.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {results.map((result, idx) => {
          const Icon = result.icon;
          const cyanColor = isDark ? '#22D3EE' : '#0891B2';
          const cyanBg = isDark ? 'bg-[#22D3EE]/10' : 'bg-[#0891B2]/10';
          
          return (
            <div key={idx} className={`${bgPrimary} rounded-xl border ${border} p-6 shadow-xl`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  result.color === 'cyan' ? cyanBg : 'bg-[#3B82F6]/10'
                }`}>
                  <Icon className={`w-5 h-5`} style={{color: result.color === 'cyan' ? cyanColor : '#3B82F6'}} />
                </div>
                <span className={`text-sm ${textSecondary}`}>{result.label}</span>
              </div>
              <div className={`text-2xl font-semibold ${textPrimary}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {result.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Convergence Table */}
      <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}>
        <button
          onClick={() => setShowTable(!showTable)}
          className={`w-full bg-gradient-to-r ${bgGradient} px-6 py-4 border-b ${borderSecondary} flex items-center justify-between ${bgHover} transition-all`}
        >
          <div>
            <h3 className={`text-base font-semibold ${textPrimary} text-left`}>Tabla de Convergencia</h3>
            <p className={`text-sm ${textSecondary} mt-1 text-left`}>
              Detalles del proceso iterativo
            </p>
          </div>
          {showTable ? (
            <ChevronUp className={`w-5 h-5 ${textSecondary}`} />
          ) : (
            <ChevronDown className={`w-5 h-5 ${textSecondary}`} />
          )}
        </button>

        {showTable && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={bgTableRow}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>
                    Iteración
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>
                    x<sub>i</sub>
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>
                    f(x<sub>i</sub>)
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1E293B]' : 'divide-[#E2E8F0]'}`}>
                {mockIterations.map((row, idx) => (
                  <tr
                    key={row.iteration}
                    className={`transition-colors ${
                      idx === mockIterations.length - 1
                        ? isDark 
                          ? 'bg-gradient-to-r from-[#22D3EE]/10 to-transparent'
                          : 'bg-gradient-to-r from-[#0891B2]/10 to-transparent'
                        : bgTableHover
                    }`}
                  >
                    <td className={`px-6 py-4 text-sm font-medium ${textTertiary}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {row.iteration}
                    </td>
                    <td className={`px-6 py-4 text-sm ${textSecondary}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {row.xi.toFixed(4)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${textSecondary}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {row.fxi.toFixed(4)}
                    </td>
                    <td className={`px-6 py-4 text-sm`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      <span style={{color: row.error < 0.02 ? (isDark ? '#22D3EE' : '#0891B2') : (isDark ? '#94A3B8' : '#475569')}}>
                        {row.error.toFixed(4)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
