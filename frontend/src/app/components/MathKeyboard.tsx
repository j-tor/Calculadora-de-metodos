import { useTheme } from "../context/ThemeContext";

interface MathKeyboardProps {
  onInsert: (symbol: string) => void;
}

const mathButtons = [
  { label: "√", value: "sqrt()", type: "function" },
  { label: "x²", value: "**2", type: "operator" },
  { label: "xⁿ", value: "**", type: "operator" },
  { label: "π", value: "pi", type: "constant" },
  { label: "e", value: "e", type: "constant" },
  { label: "log", value: "log()", type: "function" },
  { label: "ln", value: "ln()", type: "function" },
  { label: "sin", value: "sin()", type: "function" },
  { label: "cos", value: "cos()", type: "function" },
  { label: "tan", value: "tan()", type: "function" },
  { label: "/", value: "/", type: "operator" },
  { label: "()", value: "()", type: "operator" },
];

export function MathKeyboard({ onInsert }: MathKeyboardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bgSecondary = isDark ? "bg-[#1E293B]/40" : "bg-[#F1F5F9]";
  const border = isDark ? "border-[#334155]/50" : "border-[#E2E8F0]";
  const textMuted = isDark ? "text-[#64748B]" : "text-[#64748B]";

  return (
    <div className={`${bgSecondary} rounded-lg p-3 md:p-4 border ${border}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-gradient-to-b from-[#3B82F6] to-[#22D3EE] rounded-full"></div>
        <span
          className={`text-xs font-semibold ${textMuted} uppercase tracking-wider`}
        >
          Teclado Matemático
        </span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {mathButtons.map((button, idx) => (
          <button
            key={idx}
            onClick={() => onInsert(button.value)}
            className={`
              h-11 md:h-10 rounded-lg font-semibold text-sm md:text-base transition-all
              flex items-center justify-center
              ${
                button.type === "function"
                  ? "bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#3B82F6] border-2 border-[#3B82F6]/30 hover:border-[#3B82F6]/50"
                  : button.type === "constant"
                  ? isDark
                    ? "bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 text-[#22D3EE] border-2 border-[#22D3EE]/30 hover:border-[#22D3EE]/50"
                    : "bg-[#0891B2]/10 hover:bg-[#0891B2]/20 text-[#0891B2] border-2 border-[#0891B2]/30 hover:border-[#0891B2]/50"
                  : isDark
                  ? "bg-[#334155]/60 hover:bg-[#334155]/80 text-[#E2E8F0] border-2 border-[#334155] hover:border-[#475569]"
                  : "bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#334155] border-2 border-[#CBD5E1] hover:border-[#94A3B8]"
              }
              active:scale-95
            `}
            title={button.value}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}
