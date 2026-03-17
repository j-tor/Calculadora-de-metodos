import { Search, Mic, Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface TopBarProps {
  onVoiceCommand: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export function TopBar({
  onVoiceCommand,
  onToggleSidebar,
  isSidebarCollapsed,
}: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const bgPrimary = isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]";
  const bgSecondary = isDark ? "bg-[#1E293B]" : "bg-white";
  const textPrimary = isDark ? "text-[#F8FAFC]" : "text-[#0F172A]";
  const textMuted = isDark ? "text-[#64748B]" : "text-[#64748B]";
  const border = isDark ? "border-[#1E293B]" : "border-[#E2E8F0]";
  const borderFocus = isDark ? "border-[#334155]" : "border-[#CBD5E1]";

  return (
    <div
      className={`h-14 md:h-16 ${bgPrimary} border-b ${border} flex items-center justify-between px-3 md:px-6`}
    >
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg ${
            isDark ? "hover:bg-[#1E293B]" : "hover:bg-[#E2E8F0]"
          } ${textPrimary} transition-colors flex-shrink-0`}
          title={isSidebarCollapsed ? "Mostrar sidebar" : "Ocultar sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1
          className={`text-sm md:text-lg font-semibold ${textPrimary} hidden sm:block flex-shrink-0`}
        >
          Numerical Methods Lab
        </h1>
        <h1
          className={`text-sm font-semibold ${textPrimary} sm:hidden flex-shrink-0`}
        >
          NM Lab
        </h1>

        <div className="flex-1 relative mr-2 md:mr-6 min-w-0">
          <Search
            className={`absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${textMuted}`}
          />
          <input
            type="text"
            placeholder="Buscar método numérico..."
            className={`w-full ${bgSecondary} border ${borderFocus} rounded-lg pl-8 md:pl-10 pr-10 md:pr-12 py-1.5 md:py-2 text-xs md:text-sm ${textPrimary} focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all`}
          />
          <button
            onClick={onVoiceCommand}
            className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 p-1 md:p-1.5 rounded-md bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-colors group flex-shrink-0"
            title="Comando de voz"
          >
            <Mic className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg ${
          isDark
            ? "bg-[#1E293B] hover:bg-[#334155]"
            : "bg-[#E2E8F0] hover:bg-[#CBD5E1]"
        } ${textPrimary} transition-colors flex-shrink-0`}
        title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        {isDark ? (
          <Sun className="w-4 h-4 md:w-5 md:h-5" />
        ) : (
          <Moon className="w-4 h-4 md:w-5 md:h-5" />
        )}
      </button>
    </div>
  );
}
