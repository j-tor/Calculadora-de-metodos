import { useState } from 'react';
import { MathKeyboard } from './MathKeyboard';
import { Calculator, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MathInputPanelProps {
  selectedMethod: string;
}

export function MathInputPanel({ selectedMethod }: MathInputPanelProps) {
  const [mathInput, setMathInput] = useState('');
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

  const handleInsertSymbol = (symbol: string) => {
    setMathInput(prev => prev + symbol);
  };

  return (
    <div className="space-y-4">
      {/* Math Input Box */}
      <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}>
        <div className={`bg-gradient-to-r ${bgGradient} px-6 py-4 border-b ${borderSecondary}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-[#3B82F6]/10' : 'bg-[#3B82F6]/10'}`}>
              <Calculator className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${textPrimary}`}>Editor Matemático</h3>
              <p className={`text-sm ${textSecondary} mt-0.5`}>
                Ingrese la función o expresión
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Function Label */}
          <div className="mb-3 flex items-center gap-2">
            <span className={`${textTertiary} font-medium text-lg`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              f(x) =
            </span>
          </div>

          {/* Large Math Input */}
          <div className="relative">
            <textarea
              value={mathInput}
              onChange={(e) => setMathInput(e.target.value)}
              placeholder="x^3 - 2*x - 5"
              className={`w-full ${bgSecondary} border-2 ${borderSecondary} focus:border-[#3B82F6] rounded-xl px-6 py-5 ${textPrimary} ${placeholder} focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 transition-all resize-none text-xl min-h-[120px]`}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>

          {/* Math Keyboard */}
          <div className="mt-4">
            <MathKeyboard onInsert={handleInsertSymbol} />
          </div>
        </div>
      </div>
    </div>
  );
}