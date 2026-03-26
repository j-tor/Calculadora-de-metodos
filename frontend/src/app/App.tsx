import { useState } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { validateCalculatorInput } from "./utils/fieldValidation";
import { MethodSidebar } from "./components/MethodSidebar";
import { TopBar } from "./components/TopBar";
import { MathInputPanel } from "./components/MathInputPanel";
import { ParametersPanel } from "./components/ParametersPanel";
import { DynamicResultsPanel } from "./components/DynamicResultsPanel";
import { GraphPanel } from "./components/GraphPanel";
import { VoiceCommandDialog } from "./components/VoiceCommandDialog";

function AppContent() {
  const [selectedMethod, setSelectedMethod] = useState("newton");
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);
  const [resultMethod,setResultMethod] = useState("");
  const [hasResults, setHasResults] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [mathInput, setMathInput] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const METHOD_TO_BACKEND: Record<string, string> = {
    "newton": "newton",
    "bisection": "bisection",
    "fixed-point": "fixed-point",
    "jacobi": "jacobi",
    "gauss-seidel": "gauss-seidel",
    "lu": "lu",
    "lagrange": "lagrange",
    "newton-divided": "newton-divided",
    "cubic-spline": "cubic-spline",
    "euler": "euler",
    "verlet": "verlet",
    "rk4": "rk4",
  };

  const handleCalculate = async (overrides?: {
    method?: string;
    equation?: string;
    paramValues?: Record<string, string>;
  }) => {
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const endpoint = `${apiBase}/api/calculator/calculate`;
    const methodToUse = overrides?.method ?? selectedMethod;
    const backendMethod = METHOD_TO_BACKEND[methodToUse] ?? methodToUse;
    const equationToUse = overrides?.equation ?? mathInput;
    const paramValuesToUse = overrides?.paramValues ?? paramValues;

    const validation = validateCalculatorInput(
      methodToUse,
      paramValuesToUse,
      equationToUse
    );
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      const msg = Object.values(validation.errors)[0];
      setApiError(msg ?? "Revisa los campos marcados");
      return;
    }
    setFieldErrors({});

    const payload: Record<string, any> = { method: backendMethod };

    if (equationToUse.trim() !== "") {
      payload.equation = equationToUse.trim();
    }

    Object.entries(paramValuesToUse).forEach(([key, value]) => {
      if (value === "") return;
      if (key === "matrixA" || key === "vectorB") {
        payload[key] = value;
        return;
      }
      if (key === 'x_values_str' || key === 'y_values_str') {
        const parts = value.split(',').map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
        const newKey = key === 'x_values_str' ? 'x_values' : 'y_values';
        payload[newKey] = parts;
        return;
      }
      const num = Number(value);
      payload[key] = Number.isFinite(num) ? num : value;
    });

    try {
      setIsLoading(true);
      setApiError(null);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const errorMessage = err?.detail || err?.message || "Error del servidor";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResultMethod(backendMethod);
      setApiResult(data);
      setHasResults(true);
    } catch (error: any) {
      setApiResult(null);
      setHasResults(false);
      const userMessage = error?.message || "Ocurrió un error inesperado";
      setApiError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParamChange = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      if (name === "matrixA" || name === "vectorB") {
        delete next.matrixA;
        delete next.vectorB;
      }
      return next;
    });
  };

  const handleMathInputChange = (value: string) => {
    setMathInput(value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.equation;
      return next;
    });
  };

  const handleVoiceCommand = () => {
    setIsVoiceDialogOpen(true);
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    console.log(method);

    if (window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }
  };

  const bgPrimary = isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]";

  const bgOverlay = isDark
    ? "bg-gradient-to-br from-[#0F172A] via-[#0F172A]/95 to-[#1E293B]/80"
    : "bg-gradient-to-br from-[#F8FAFC] via-[#F8FAFC]/95 to-[#E2E8F0]/50";

  const gridColor = isDark ? "#3B82F6" : "#CBD5E1";
  const dotColor = isDark ? "#22D3EE" : "#0891B2";
  const gridOpacity = isDark ? 0.03 : 0.02;
  // El editor de ecuación solo aplica a métodos que realmente reciben una ecuación f(x)
  const equationMethods = [
    "newton",
    "bisection",
    "fixed-point",
    // EDO
    "euler",
    "rk2",
    "rk4",
    "verlet",
    "verlet-error",
    "euler-order",
  ];
  const showMathInput = equationMethods.includes(selectedMethod);

  return (
    <div className={`min-h-screen ${bgPrimary} flex overflow-hidden relative`}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: gridOpacity }}
      >
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke={gridColor}
                strokeWidth="0.5"
              />
            </pattern>

            <pattern
              id="dots"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill={dotColor} />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className={`absolute inset-0 ${bgOverlay} pointer-events-none`} />

      <div className="relative z-10 flex w-full">
        <MethodSidebar
          selectedMethod={selectedMethod}
          onMethodSelect={handleMethodSelect}
          isCollapsed={isSidebarCollapsed}
          onClose={handleToggleSidebar}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            onVoiceCommand={handleVoiceCommand}
            onToggleSidebar={handleToggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
          />

          <div className="flex-1 overflow-auto p-3 md:p-6">
            <div className="max-w-[2000px] mx-auto space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                {showMathInput && (
                  <div className="lg:col-span-8">
                    <MathInputPanel
                      selectedMethod={selectedMethod}
                      value={mathInput}
                      onChange={handleMathInputChange}
                      error={fieldErrors.equation}
                    />
                  </div>
                )}

                <div className={showMathInput ? "lg:col-span-4" : "lg:col-span-12"}>
                  <ParametersPanel
                    selectedMethod={selectedMethod}
                    onCalculate={handleCalculate}
                    onVoiceCommand={handleVoiceCommand}
                    values={paramValues}
                    onValueChange={handleParamChange}
                    fieldErrors={fieldErrors}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`h-0.5 flex-1 bg-gradient-to-r from-transparent ${
                      isDark ? "via-[#334155]" : "via-[#CBD5E1]"
                    } to-transparent`}
                  />

                  <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider">
                    Resultados
                  </h2>

                  <div
                    className={`h-0.5 flex-1 bg-gradient-to-r from-transparent ${
                      isDark ? "via-[#334155]" : "via-[#CBD5E1]"
                    } to-transparent`}
                  />
                </div>

                <DynamicResultsPanel
                  selectedMethod={selectedMethod}
                  hasResults={hasResults}
                  apiResult={apiResult}
                  apiError={apiError}
                  isLoading={isLoading}
                />
              </div>

              <div>
                <GraphPanel selectedMethod={resultMethod} hasResults={hasResults} apiResult={apiResult} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <VoiceCommandDialog
        isOpen={isVoiceDialogOpen}
        onClose={() => setIsVoiceDialogOpen(false)}
        onComplete={(method, params, equation) => {
          const nextParamValues = { ...paramValues, ...params };
          setSelectedMethod(method);
          setParamValues(nextParamValues);
          if (equation && equation.trim() !== "") setMathInput(equation.trim());

          // Calcula con los valores ya fusionados (evita problemas de timing con setState)
          handleCalculate({
            method,
            equation: equation?.trim() ?? "",
            paramValues: nextParamValues,
          });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
