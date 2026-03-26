import {
  Calculator,
  Target,
  GitBranch,
  Grid3x3,
  ChevronDown,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface MethodSidebarProps {
  selectedMethod: string;
  onMethodSelect: (method: string) => void;
  isCollapsed: boolean;
  onClose?: () => void;
}

const methodCategories = [
  {
    id: "roots",
    name: "Raices de Ecuaciones",
    icon: Target,
    methods: [
      { id: "newton", name: "Metodo de Newton-Raphson" },
      { id: "bisection", name: "Metodo de Biseccion" },
      { id: "fixed-point", name: "Punto Fijo" },
    ],
  },
  {
    id: "linear",
    name: "Sistemas Lineales",
    icon: Grid3x3,
    methods: [
      { id: "jacobi", name: "Metodo de Jacobi" },
      { id: "gauss-seidel", name: "Gauss-Seidel" },
      { id: "lu", name: "Descomposicion LU" },
    ],
  },
  {
    id: "interpolation",
    name: "Interpolacion",
    icon: GitBranch,
    methods: [
      { id: "lagrange", name: "Interpolacion de Lagrange" },
      { id: "newton-divided", name: "Interpolacion de Newton" },
      { id: "cubic-spline", name: "Trazador Cúbico" },
    ],
  },
  {
    id: "edo",
    name: "Ecuaciones Diferenciales",
    icon: Activity,
    methods: [
      { id: "euler", name: "Método de Euler" },
      { id: "verlet", name: "Método de Verlet" },
      { id: "rk4", name: "Runge-Kutta Orden 4" },
    ],
  },
];

export function MethodSidebar({
  selectedMethod,
  onMethodSelect,
  isCollapsed,
  onClose,
}: MethodSidebarProps) {
  const [expandedCategory, setExpandedCategory] = useState("roots");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bgPrimary = isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]";
  const bgSecondary = isDark ? "bg-[#1E293B]" : "bg-white";
  const bgHover = isDark ? "hover:bg-[#334155]" : "hover:bg-[#F1F5F9]";
  const textPrimary = isDark ? "text-[#F8FAFC]" : "text-[#0F172A]";
  const textSecondary = isDark ? "text-[#CBD5E1]" : "text-[#334155]";
  const textMuted = isDark ? "text-[#64748B]" : "text-[#64748B]";
  const border = isDark ? "border-[#1E293B]" : "border-[#E2E8F0]";

  return (
    <>
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`
          ${
            isCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
          }
          fixed lg:relative
          inset-y-0 left-0
          w-72 lg:w-64 xl:w-72
          ${bgPrimary}
          border-r ${border}
          flex flex-col
          overflow-hidden
          transition-transform duration-300 ease-in-out
          z-30
        `}
      >
        <div className={`p-4 md:p-6 border-b ${border}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] flex items-center justify-center">
              <Calculator className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-sm md:text-base font-bold ${textPrimary}`}>
                NewtonLab
              </h2>
              <p className={`text-xs ${textMuted}`}>Métodos Numéricos</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
          {methodCategories.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategory === category.id;

            return (
              <div key={category.id}>
                <button
                  onClick={() =>
                    setExpandedCategory(isExpanded ? "" : category.id)
                  }
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg ${bgHover} transition-all ${textSecondary} group`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#3B82F6]" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-1 ml-3 space-y-1">
                    {category.methods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => onMethodSelect(method.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${
                          selectedMethod === method.id
                            ? isDark
                              ? "bg-gradient-to-r from-[#3B82F6]/20 to-[#22D3EE]/10 text-[#22D3EE] border border-[#3B82F6]/30"
                              : "bg-gradient-to-r from-[#3B82F6]/10 to-[#0891B2]/5 text-[#0891B2] border border-[#3B82F6]/30"
                            : `${textSecondary} ${bgHover}`
                        }`}
                      >
                        {method.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
