import { MathKeyboard } from "./MathKeyboard";
import { Calculator, Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useRef } from "react";

interface MathInputPanelProps {
  selectedMethod: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function MathInputPanel({ selectedMethod, value, onChange, error }: MathInputPanelProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const bgPrimary = isDark ? "bg-[#0F172A]" : "bg-white";
  const bgSecondary = isDark ? "bg-[#1E293B]" : "bg-[#F1F5F9]";
  const bgGradient = isDark
    ? "from-[#1E293B] to-[#334155]/50"
    : "from-[#E2E8F0] to-[#F1F5F9]";
  const textPrimary = isDark ? "text-[#F8FAFC]" : "text-[#0F172A]";
  const textSecondary = isDark ? "text-[#94A3B8]" : "text-[#475569]";
  const textTertiary = isDark ? "text-[#CBD5E1]" : "text-[#334155]";
  const border = isDark ? "border-[#1E293B]" : "border-[#E2E8F0]";
  const borderSecondary = isDark ? "border-[#334155]" : "border-[#CBD5E1]";
  const placeholder = isDark
    ? "placeholder-[#64748B]"
    : "placeholder-[#94A3B8]";

  const handleInsertSymbol = (symbol: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + symbol);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;

    let insertText = symbol;
    let cursorOffset = symbol.length;

    if (symbol === "()" ) {
      insertText = "()";
      cursorOffset = 1;
    }

    if (symbol === "log(, 10)") {
      insertText = symbol;
      cursorOffset = "log(".length;
    }

    const newValue = value.slice(0, start) + insertText + value.slice(end);
    onChange(newValue);

    const newCursorPos = start + cursorOffset;
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Math Input Box */}
      <div
        className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}
      >
        <div
          className={`bg-gradient-to-r ${bgGradient} px-4 md:px-6 py-3 md:py-4 border-b ${borderSecondary}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 md:p-2 rounded-lg ${isDark ? "bg-[#3B82F6]/10" : "bg-[#3B82F6]/10"
                }`}
            >
              <Calculator className="w-4 h-4 md:w-5 md:h-5 text-[#3B82F6]" />
            </div>
            <div>
              <h3
                className={`text-sm md:text-base font-semibold ${textPrimary}`}
              >
                Editor Matemático
              </h3>
              <p className={`text-xs md:text-sm ${textSecondary} mt-0.5`}>
                Ingrese la función o expresión
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Function Label */}
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`${textTertiary} font-medium text-base md:text-lg whitespace-nowrap`}
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {(() => {
                if (["euler", "rk2", "rk4"].includes(selectedMethod)) return "dy/dx =";
                if (selectedMethod === "verlet") return "d²y/dx² =";
                return "f(x) =";
              })()}
            </span>
          </div>

          {/* Large Math Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={(() => {
                if (["euler", "rk2", "rk4"].includes(selectedMethod)) return "ej. y - x";
                if (selectedMethod === "verlet") return "ej. -y";
                return "ej. x**2 - 4*x + 4";
              })()}
              aria-invalid={!!error}
              className={`w-full ${bgSecondary} border-2 ${error ? "border-red-500 ring-2 ring-red-500/25" : borderSecondary} focus:border-[#3B82F6] rounded-xl px-4 md:px-6 py-4 md:py-5 ${textPrimary} ${placeholder} focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 transition-all resize-none text-lg md:text-xl min-h-[100px] md:min-h-[120px]`}
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            />
            {error ? (
              <p className="text-red-500 text-sm mt-2" role="alert">
                {error}
              </p>
            ) : null}
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
