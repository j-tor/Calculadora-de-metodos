import { CheckCircle2, AlertCircle, TrendingUp, Hash, ChevronDown, ChevronUp, Info, Sigma } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export interface Coordinate {
  x: number;
  y: number;
}

export interface CalculationResponse {
  method_used: string;
  result?: number;
  iterations?: number;
  coordinates?: Coordinate[];
  message?: string;
  converges?: boolean;
  value?: number;
  polynomial?: string;
  coefficients?: number[];
  spline_coefficients?: Record<string, number[]>;
  solution?: number[];
  l_matrix?: number[][];
  u_matrix?: number[][];
  jacobian?: string;
  jacobian_numeric?: number[][];
  x_values?: number[];
  y_values?: number[];
  v_values?: number[];
  order?: number;
  local_order?: number;
  error?: number;
  errors?: number[];
  converged?: boolean;
  x_eval?: number;
  tolerance?: number;
}

interface DynamicResultsPanelProps {
  selectedMethod: string;
  hasResults: boolean;
  apiResult: CalculationResponse | null;
  apiError: string | null;
  isLoading: boolean;
}

const INTERPOLATION_METHODS = ["lagrange", "newton-divided", "cubic-spline"];
const ROOT_METHODS = ["bisection", "newton", "fixed-point"];
const MATRIX_SOLVER_METHODS = ["jacobi", "gauss-seidel"];
const ODE_METHODS = ["euler", "verlet", "rk4"];

const getDisplayResults = (method: string, data: CalculationResponse | null) => {
  if (!data) return [];

  const results = [];

  if (ODE_METHODS.includes(method) && data.result !== undefined && data.result !== null) {
    results.push({
      label: "Valor final y(x_end)",
      value: data.result.toFixed(8),
      icon: CheckCircle2,
      color: "cyan",
    });
    if (data.x_values) {
      results.push({
        label: "Pasos calculados",
        value: (data.x_values.length - 1).toString(),
        icon: Hash,
        color: "blue",
      });
    }
    return results;
  }

  if (ROOT_METHODS.includes(method) && data.result !== undefined && data.result !== null) {
    results.push({
      label: "Resultado",
      value: data.result.toFixed(6),
      icon: CheckCircle2,
      color: "cyan",
    });
  } else if (INTERPOLATION_METHODS.includes(method) && data.value !== undefined && data.value !== null) {
    results.push({
      label: "Valor Interpolado",
      value: data.value.toFixed(6),
      icon: CheckCircle2,
      color: "cyan",
    });
  }

  if (data.iterations != null) {
    results.push({ label: "Iteraciones", value: data.iterations.toString(), icon: Hash, color: "blue" });
  }

  if (MATRIX_SOLVER_METHODS.includes(method) && data.solution && data.solution.length > 0) {
    const lines = data.solution.map((v, idx) => `x${idx + 1} = ${Number(v).toFixed(6)}`);
    results.push({
      label: "Solución x",
      value: `x = [\n${lines.join("\n")}\n]`,
      icon: Sigma,
      color: "cyan",
    });
  }

  if (data.error != null && !MATRIX_SOLVER_METHODS.includes(method)) {
    results.push({
      label: "Error Estimado",
      value: data.error.toExponential(4),
      icon: TrendingUp,
      color: "cyan",
    });
  }

  if (data.converged != null || data.converges != null) {
    const converged = data.converged ?? data.converges;
    results.push({
      label: "Convergencia",
      value: converged ? "Lograda" : "No lograda",
      icon: converged ? CheckCircle2 : AlertCircle,
      color: converged ? "cyan" : "blue",
    });
  }

  return results;
};

function toSuperscript(exp: string) {
  const map: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "-": "⁻",
  };
  return exp
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
}

function formatPolynomialToMath(poly: string): string {
  let s = poly.replace(/\s+/g, "");
  s = s.replace(
    /([+\-]?)(\d*\.?\d+)?\*?x(\*\*(\d+))?/g,
    (_, sign, coeff, _expPart, exp) => {
      const effectiveCoeff = coeff === undefined || coeff === "" ? "1" : coeff;
      const num = Number(effectiveCoeff);
      const rounded = num.toFixed(6);
      const cleanedCoeff = rounded === "1.000000" ? "" : rounded;
      const signChar = sign === "" ? "" : sign;
      const expStr = exp && exp !== "1" ? toSuperscript(exp) : "";
      return `${signChar}${cleanedCoeff}x${expStr}`;
    }
  );
  s = s.replace(/\*/g, "");
  s = s.replace(/^\+/, "");
  s = s.replace(/\+\-/g, "-");
  return s;
}

export function DynamicResultsPanel({
  selectedMethod,
  hasResults,
  apiResult,
  apiError,
  isLoading,
}: DynamicResultsPanelProps) {
  const [showTable, setShowTable] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bgPrimary = isDark ? "bg-[#0F172A]" : "bg-white";
  const bgSecondary = isDark ? "bg-[#1E293B]" : "bg-[#F1F5F9]";
  const bgGradient = isDark
    ? "from-[#1E293B] to-[#334155]/50"
    : "from-[#E2E8F0] to-[#F1F5F9]";
  const bgHover = isDark
    ? "hover:from-[#334155]/60 hover:to-[#334155]/40"
    : "hover:from-[#CBD5E1] hover:to-[#E2E8F0]";
  const bgTableRow = isDark ? "bg-[#1E293B]/60" : "bg-[#F1F5F9]";
  const bgTableHover = isDark ? "hover:bg-[#1E293B]/40" : "hover:bg-[#E2E8F0]";
  const textPrimary = isDark ? "text-[#F8FAFC]" : "text-[#0F172A]";
  const textSecondary = isDark ? "text-[#94A3B8]" : "text-[#475569]";
  const textTertiary = isDark ? "text-[#CBD5E1]" : "text-[#334155]";
  const textMuted = isDark ? "text-[#64748B]" : "text-[#64748B]";
  const border = isDark ? "border-[#1E293B]" : "border-[#E2E8F0]";
  const borderSecondary = isDark ? "border-[#334155]" : "border-[#CBD5E1]";

  if (isLoading) {
    return (
      <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl p-12 text-center animate-pulse`}>
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${isDark ? "bg-[#1E293B]/60" : "bg-[#F1F5F9]"} flex items-center justify-center`}>
          <TrendingUp className={`w-10 h-10 ${textMuted} animate-bounce`} />
        </div>
        <h3 className={`text-lg font-semibold ${textTertiary} mb-2`}>Calculando...</h3>
        <p className={`text-sm ${textMuted}`}>Procesando la solicitud en el servidor</p>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className={`${bgPrimary} rounded-xl border border-red-500/50 shadow-2xl p-12 text-center`}>
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center`}>
          <AlertCircle className={`w-10 h-10 text-red-500`} />
        </div>
        <h3 className={`text-lg font-semibold text-red-500 mb-2`}>Error</h3>
        <p className={`text-sm ${textMuted}`}>{apiError}</p>
      </div>
    );
  }

  if (!hasResults || !apiResult) {
    return (
      <div
        className={`${bgPrimary} rounded-xl border ${border} shadow-2xl p-12 text-center`}
      >
        <div
          className={`w-20 h-20 mx-auto mb-4 rounded-full ${isDark ? "bg-[#1E293B]/60" : "bg-[#F1F5F9]"
            } flex items-center justify-center`}
        >
          <Info className={`w-10 h-10 ${textMuted}`} />
        </div>
        <h3 className={`text-lg font-semibold ${textTertiary} mb-2`}>
          Sin Resultados
        </h3>
        <p className={`text-sm ${textMuted}`}>
          Configure los parámetros y presione "Calcular Solución" para ver los
          resultados
        </p>
      </div>
    );
  }

  const results = getDisplayResults(selectedMethod, apiResult);
  const isInterpolationMethod = INTERPOLATION_METHODS.includes(selectedMethod);
  const isRootMethod = ROOT_METHODS.includes(selectedMethod);
  const isOdeMethod = ODE_METHODS.includes(selectedMethod);
  const matrixSolverConverged =
    MATRIX_SOLVER_METHODS.includes(selectedMethod) &&
    (apiResult?.converged ?? apiResult?.converges) != null
      ? (apiResult?.converged ?? apiResult?.converges)
      : null;
  const iterations = apiResult.x_values ? apiResult.x_values.map((xi, idx) => ({
    iteration: idx,
    xi: xi,
    fxi: apiResult.y_values ? apiResult.y_values[idx] : 0,
    error: apiResult?.errors?.[idx] ?? 0,
  })) : [];
  const odeSteps = isOdeMethod && apiResult.x_values && apiResult.y_values
    ? apiResult.x_values.map((xi, idx) => ({
        step: idx,
        x: xi,
        y: (apiResult.y_values as number[])[idx],
        v: apiResult.v_values ? (apiResult.v_values as number[])[idx] : undefined,
      }))
    : [];
  const points = (apiResult.x_values && apiResult.y_values)
    ? apiResult.x_values.map((x, idx) => ({ x, y: apiResult.y_values?.[idx] }))
    : [];
  const newtonCoeffs = apiResult.coefficients ?? [];
  const spline = apiResult.spline_coefficients;

  const newtonPolynomialText = (() => {
    if (selectedMethod !== "newton-divided" || !apiResult.coefficients || !apiResult.x_values) {
      return null;
    }
    const xNodes = apiResult.x_values;
    const terms = apiResult.coefficients.map((coef, idx) => {
      const c = Number(coef).toFixed(6);
      if (idx === 0) return `${c}`;
      const factors = xNodes.slice(0, idx).map((xi) => `(x - ${Number(xi).toFixed(6)})`).join("");
      return `${c}${factors}`;
    });
    return terms.join(" + ");
  })();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Dynamic Result Cards */}
      <div
        className={`grid gap-3 md:gap-4 ${results.length === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}
      >
        {results.map((result, idx) => {
          const Icon = result.icon;
          const cyanColor = isDark ? "#22D3EE" : "#0891B2";
          const cyanBg = isDark ? "bg-[#22D3EE]/10" : "bg-[#0891B2]/10";

          return (
            <div
              key={idx}
              className={`${bgPrimary} rounded-xl border ${border} p-4 md:p-6 shadow-xl`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2 rounded-lg ${result.color === "cyan" ? cyanBg : "bg-[#3B82F6]/10"
                    }`}
                >
                  <Icon
                    className={`w-4 h-4 md:w-5 md:h-5`}
                    style={{
                      color: result.color === "cyan" ? cyanColor : "#3B82F6",
                    }}
                  />
                </div>
                <span className={`text-xs md:text-sm ${textSecondary}`}>
                  {result.label}
                </span>
              </div>
              <div
                className={`text-xl md:text-2xl font-semibold ${textPrimary}`}
                style={{ fontFamily: "JetBrains Mono, monospace", whiteSpace: "pre-line" }}
              >
                {result.value}
              </div>
            </div>
          );
        })}
      </div>

      {matrixSolverConverged !== null && (
        <div
          className={`rounded-xl border p-4 ${
            matrixSolverConverged
              ? isDark
                ? "bg-green-500/10 border-green-500/30"
                : "bg-green-50 border-green-200"
              : isDark
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-blue-50 border-blue-200"
          }`}
        >
          {matrixSolverConverged ? (
            <div className={`text-sm md:text-base ${textPrimary}`}>
              Convergencia lograda.
            </div>
          ) : (
            <div className={`text-sm md:text-base ${textPrimary}`}>
              La matriz puede no ser diagonalmente dominante. Verifique que{" "}
              <span style={{ fontFamily: "JetBrains Mono, monospace" }}>
                |a_ii| &gt; Σ|a_ij|
              </span>{" "}
              para cada fila.
            </div>
          )}
        </div>
      )}

      {isInterpolationMethod && (
        <>
          {((selectedMethod === "lagrange" && apiResult.polynomial) || (selectedMethod === "newton-divided" && newtonPolynomialText)) && (
            <div className={`${bgPrimary} rounded-xl border ${border} p-4 md:p-6 shadow-xl`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${isDark ? "bg-[#22D3EE]/10" : "bg-[#0891B2]/10"}`}>
                  <Sigma className="w-4 h-4 md:w-5 md:h-5" style={{ color: isDark ? "#22D3EE" : "#0891B2" }} />
                </div>
                <span className={`text-xs md:text-sm ${textSecondary}`}>Polinomio Resultante P(x)</span>
              </div>
              <div className={`text-sm md:text-base ${textPrimary} mb-2`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                {selectedMethod === "lagrange" ? apiResult.polynomial : newtonPolynomialText}
              </div>
              {selectedMethod === "lagrange" && apiResult.polynomial && (
                <>
                  <div className={`text-xs md:text-sm ${textSecondary} mt-2 mb-1`}>
                    Notación Matemática
                  </div>
                  <div className={`text-sm md:text-base ${textPrimary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {formatPolynomialToMath(apiResult.polynomial)}
                  </div>
                </>
              )}
            </div>
          )}

          <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}>
            <div className={`w-full bg-gradient-to-r ${bgGradient} px-4 md:px-6 py-3 md:py-4 border-b ${borderSecondary}`}>
              <h3 className={`text-sm md:text-base font-semibold ${textPrimary} text-left`}>Tabla de Puntos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={bgTableRow}>
                  <tr>
                    <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>x</th>
                    <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>y</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-[#1E293B]" : "divide-[#E2E8F0]"}`}>
                  {points.map((row, idx) => (
                    <tr key={idx} className={bgTableHover}>
                      <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{Number(row.x).toFixed(6)}</td>
                      <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{Number(row.y).toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedMethod === "newton-divided" && (
            <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}>
              <div className={`w-full bg-gradient-to-r ${bgGradient} px-4 md:px-6 py-3 md:py-4 border-b ${borderSecondary}`}>
                <h3 className={`text-sm md:text-base font-semibold ${textPrimary} text-left`}>Tabla de Diferencias Divididas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={bgTableRow}>
                    <tr>
                      <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>k</th>
                      <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>Coeficiente</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-[#1E293B]" : "divide-[#E2E8F0]"}`}>
                    {newtonCoeffs.map((coef, idx) => (
                      <tr key={idx} className={bgTableHover}>
                        <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{idx}</td>
                        <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{Number(coef).toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedMethod === "cubic-spline" && spline && (
            <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}>
              <div className={`w-full bg-gradient-to-r ${bgGradient} px-4 md:px-6 py-3 md:py-4 border-b ${borderSecondary}`}>
                <h3 className={`text-sm md:text-base font-semibold ${textPrimary} text-left`}>Coeficientes del Spline</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={bgTableRow}>
                    <tr>
                      <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>Intervalo</th>
                      <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>a</th>
                      <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>b</th>
                      <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>c</th>
                      <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>d</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-[#1E293B]" : "divide-[#E2E8F0]"}`}>
                    {(spline.a ?? []).map((_, idx) => (
                      <tr key={idx} className={bgTableHover}>
                        <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{idx}</td>
                        <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{Number(spline.a?.[idx] ?? 0).toFixed(6)}</td>
                        <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{Number(spline.b?.[idx] ?? 0).toFixed(6)}</td>
                        <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{Number(spline.c?.[idx] ?? 0).toFixed(6)}</td>
                        <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{Number(spline.d?.[idx] ?? 0).toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {isRootMethod && (
        <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}>
          <button
            onClick={() => setShowTable(!showTable)}
            className={`w-full bg-gradient-to-r ${bgGradient} px-4 md:px-6 py-3 md:py-4 border-b ${borderSecondary} flex items-center justify-between ${bgHover} transition-all`}
          >
            <div>
              <h3 className={`text-sm md:text-base font-semibold ${textPrimary} text-left`}>Tabla de Convergencia</h3>
              <p className={`text-xs md:text-sm ${textSecondary} mt-1 text-left`}>Detalles del proceso iterativo</p>
            </div>
            {showTable ? (
              <ChevronUp className={`w-5 h-5 ${textSecondary} flex-shrink-0`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${textSecondary} flex-shrink-0`} />
            )}
          </button>

          {showTable && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={bgTableRow}>
                  <tr>
                    <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>Iteración</th>
                    <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>x<sub>i</sub></th>
                    <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>f(x<sub>i</sub>)</th>
                    <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>Error</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-[#1E293B]" : "divide-[#E2E8F0]"}`}>
                  {iterations.map((row, idx) => (
                    <tr key={row.iteration} className={`transition-colors ${idx === iterations.length - 1 ? (isDark ? "bg-gradient-to-r from-[#22D3EE]/10 to-transparent" : "bg-gradient-to-r from-[#0891B2]/10 to-transparent") : bgTableHover}`}>
                      <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium ${textTertiary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{row.iteration}</td>
                      <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{row.xi?.toFixed(4) ?? "0.0000"}</td>
                      <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{row.fxi?.toFixed(4) ?? "0.0000"}</td>
                      <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        <span style={{ color: row.error < 0.02 ? (isDark ? "#22D3EE" : "#0891B2") : (isDark ? "#94A3B8" : "#475569") }}>{row.error.toFixed(4)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isOdeMethod && odeSteps.length > 0 && (
        <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}>
          <button
            onClick={() => setShowTable(!showTable)}
            className={`w-full bg-gradient-to-r ${bgGradient} px-4 md:px-6 py-3 md:py-4 border-b ${borderSecondary} flex items-center justify-between ${bgHover} transition-all`}
          >
            <div>
              <h3 className={`text-sm md:text-base font-semibold ${textPrimary} text-left`}>Tabla de Solución</h3>
              <p className={`text-xs md:text-sm ${textSecondary} mt-1 text-left`}>{odeSteps.length} pasos computados</p>
            </div>
            {showTable ? (
              <ChevronUp className={`w-5 h-5 ${textSecondary} flex-shrink-0`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${textSecondary} flex-shrink-0`} />
            )}
          </button>

          {showTable && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={bgTableRow}>
                  <tr>
                    <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>Paso</th>
                    <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>x</th>
                    <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>y(x)</th>
                    {selectedMethod === "verlet" && (
                      <th className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>v(x)</th>
                    )}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-[#1E293B]" : "divide-[#E2E8F0]"}`}>
                  {odeSteps.map((row, idx) => (
                    <tr
                      key={row.step}
                      className={`transition-colors ${
                        idx === odeSteps.length - 1
                          ? isDark
                            ? "bg-gradient-to-r from-[#22D3EE]/10 to-transparent"
                            : "bg-gradient-to-r from-[#0891B2]/10 to-transparent"
                          : bgTableHover
                      }`}
                    >
                      <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium ${textTertiary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{row.step}</td>
                      <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{Number(row.x).toFixed(6)}</td>
                      <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{Number(row.y).toFixed(8)}</td>
                      {selectedMethod === "verlet" && (
                        <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{row.v !== undefined ? Number(row.v).toFixed(8) : "—"}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
