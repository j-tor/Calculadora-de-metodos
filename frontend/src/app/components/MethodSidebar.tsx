import { Calculator, Target, Sigma, TrendingUp, GitBranch, Grid3x3, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface MethodSidebarProps {
  selectedMethod: string;
  onMethodSelect: (method: string) => void;
  isCollapsed: boolean;
}

const methodCategories = [
  {
    id: 'roots',
    name: 'Raíces de Ecuaciones',
    icon: Target,
    methods: [
      { id: 'newton', name: 'Método de Newton-Raphson' },
      { id: 'bisection', name: 'Método de Bisección' },
      { id: 'secant', name: 'Método de la Secante' },
      { id: 'fixed-point', name: 'Punto Fijo' },
      { id: 'false-position', name: 'Falsa Posición' },
    ],
  },
  {
    id: 'linear',
    name: 'Sistemas Lineales',
    icon: Grid3x3,
    methods: [
      { id: 'gauss', name: 'Eliminación Gaussiana' },
      { id: 'gauss-jordan', name: 'Gauss-Jordan' },
      { id: 'lu', name: 'Factorización LU' },
      { id: 'jacobi', name: 'Método de Jacobi' },
      { id: 'gauss-seidel', name: 'Gauss-Seidel' },
    ],
  },
  {
    id: 'integration',
    name: 'Integración Numérica',
    icon: Sigma,
    methods: [
      { id: 'simpson-1-3', name: 'Simpson 1/3' },
      { id: 'simpson-3-8', name: 'Simpson 3/8' },
      { id: 'trapezoidal', name: 'Regla Trapezoidal' },
      { id: 'romberg', name: 'Integración de Romberg' },
    ],
  },
  {
    id: 'differential',
    name: 'Ecuaciones Diferenciales',
    icon: TrendingUp,
    methods: [
      { id: 'euler', name: 'Método de Euler' },
      { id: 'rk2', name: 'Runge-Kutta 2° Orden' },
      { id: 'rk4', name: 'Runge-Kutta 4° Orden' },
      { id: 'adams-bashforth', name: 'Adams-Bashforth' },
    ],
  },
  {
    id: 'interpolation',
    name: 'Interpolación',
    icon: GitBranch,
    methods: [
      { id: 'lagrange', name: 'Interpolación de Lagrange' },
      { id: 'newton-divided', name: 'Diferencias Divididas' },
      { id: 'spline', name: 'Spline Cúbico' },
    ],
  },
];

export function MethodSidebar({ selectedMethod, onMethodSelect, isCollapsed }: MethodSidebarProps) {
  const [expandedCategory, setExpandedCategory] = useState('roots');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bgPrimary = isDark ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]';
  const bgSecondary = isDark ? 'bg-[#1E293B]' : 'bg-white';
  const bgHover = isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#F1F5F9]';
  const textPrimary = isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]';
  const textSecondary = isDark ? 'text-[#CBD5E1]' : 'text-[#334155]';
  const textMuted = isDark ? 'text-[#64748B]' : 'text-[#64748B]';
  const border = isDark ? 'border-[#1E293B]' : 'border-[#E2E8F0]';

  if (isCollapsed) {
    return null;
  }

  return (
    <div className={`w-72 ${bgPrimary} border-r ${border} flex flex-col overflow-hidden`}>
      {/* Sidebar Header */}
      <div className={`p-6 border-b ${border}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${textPrimary}`}>NumLab</h2>
            <p className={`text-xs ${textMuted}`}>Métodos Numéricos</p>
          </div>
        </div>
      </div>

      {/* Methods List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {methodCategories.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategory === category.id;
          
          return (
            <div key={category.id}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? '' : category.id)}
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
                            ? 'bg-gradient-to-r from-[#3B82F6]/20 to-[#22D3EE]/10 text-[#22D3EE] border border-[#3B82F6]/30'
                            : 'bg-gradient-to-r from-[#3B82F6]/10 to-[#0891B2]/5 text-[#0891B2] border border-[#3B82F6]/30'
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
  );
}