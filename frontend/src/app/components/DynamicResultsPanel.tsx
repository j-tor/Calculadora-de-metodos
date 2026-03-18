import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Hash,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  Calculator,
  Sigma,
  Grid3X3,
  Table2,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface DynamicResultsPanelProps {
  selectedMethod: string;
  hasResults: boolean;
  apiResult?: any;
  apiError?: string | null;
  isLoading?: boolean;
}

/* ─── helpers to build result cards from the real API response ─── */
function buildResultCards(apiResult: any): Array<{label: string; value: string; icon: any; color: string}> {
  if (!apiResult) return [];

  const cards: Array<{label: string; value: string; icon: any; color: string}> = [];

  // Method name
  if (apiResult.method_used) {
    cards.push({ label: "Método Usado", value: apiResult.method_used, icon: Calculator, color: "blue" });
  }

  // Root / result
  if (apiResult.result != null) {
    cards.push({ label: "Resultado", value: String(Number(apiResult.result).toPrecision(8)), icon: CheckCircle2, color: "cyan" });
  }

  // Value (interpolation)
  if (apiResult.value != null) {
    cards.push({ label: "Valor Evaluado", value: String(Number(apiResult.value).toPrecision(8)), icon: TrendingUp, color: "cyan" });
  }

  // Iterations
  if (apiResult.iterations != null) {
    cards.push({ label: "Iteraciones", value: String(apiResult.iterations), icon: Hash, color: "blue" });
  }

  // Convergence
  if (apiResult.converges != null) {
    cards.push({
      label: "Convergencia",
      value: apiResult.converges ? "Sí converge" : "No converge",
      icon: apiResult.converges ? CheckCircle2 : AlertTriangle,
      color: apiResult.converges ? "cyan" : "amber",
    });
  }

  if (apiResult.converged != null) {
    cards.push({
      label: "Convergió",
      value: apiResult.converged ? "Sí" : "No",
      icon: apiResult.converged ? CheckCircle2 : AlertTriangle,
      color: apiResult.converged ? "cyan" : "amber",
    });
  }

  // Polynomial
  if (apiResult.polynomial) {
    cards.push({ label: "Polinomio", value: String(apiResult.polynomial).substring(0, 60), icon: Sigma, color: "blue" });
  }

  // Error
  if (apiResult.error != null) {
    cards.push({ label: "Error Estimado", value: String(Number(apiResult.error).toPrecision(6)), icon: TrendingUp, color: "cyan" });
  }

  // Order
  if (apiResult.order != null) {
    cards.push({ label: "Orden Global", value: String(apiResult.order), icon: Info, color: "blue" });
  }
  if (apiResult.local_order != null) {
    cards.push({ label: "Orden Local", value: String(apiResult.local_order), icon: Info, color: "cyan" });
  }

  return cards;
}

/* ─── build iteration table rows from ODE x/y arrays ─── */
function buildTableRows(apiResult: any): Array<Record<string, string | number>> | null {
  if (!apiResult) return null;

  // ODE methods return x_values / y_values arrays
  if (apiResult.x_values && apiResult.y_values) {
    const xs: number[] = apiResult.x_values;
    const ys: number[] = apiResult.y_values;
    const vs: number[] | undefined = apiResult.v_values;
    return xs.map((x, i) => {
      const row: Record<string, string | number> = { Paso: i, x: Number(x.toPrecision(6)), y: Number(ys[i].toPrecision(6)) };
      if (vs) row["v"] = Number(vs[i].toPrecision(6));
      return row;
    });
  }

  return null;
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

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl p-12 text-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin" />
          <h3 className={`text-lg font-semibold ${textTertiary}`}>Calculando...</h3>
          <p className={`text-sm ${textMuted}`}>Procesando con el método seleccionado</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (apiError) {
    return (
      <div className={`${bgPrimary} rounded-xl border ${isDark ? "border-red-500/30" : "border-red-300"} shadow-2xl p-8`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${isDark ? "bg-red-500/10" : "bg-red-50"} flex-shrink-0`}>
            <AlertTriangle className={`w-7 h-7 ${isDark ? "text-red-400" : "text-red-500"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-semibold ${isDark ? "text-red-400" : "text-red-600"} mb-2`}>
              Error en el Cálculo
            </h3>
            <p className={`text-sm ${isDark ? "text-red-300/80" : "text-red-500"} leading-relaxed`}>
              {apiError}
            </p>
            <div className={`mt-4 p-3 rounded-lg ${isDark ? "bg-[#1E293B]/80" : "bg-[#FEF2F2]"} border ${isDark ? "border-red-500/20" : "border-red-200"}`}>
              <p className={`text-xs ${textMuted}`}>
                💡 <strong>Sugerencia:</strong> Revisa que todos los campos requeridos estén llenos y que la ecuación tenga la sintaxis correcta (ej: <code className="px-1 py-0.5 rounded bg-[#334155]/30">x**2 - 4</code>).
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── No results yet ── */
  if (!hasResults || !apiResult) {
    return (
      <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl p-12 text-center`}>
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${isDark ? "bg-[#1E293B]/60" : "bg-[#F1F5F9]"} flex items-center justify-center`}>
          <Info className={`w-10 h-10 ${textMuted}`} />
        </div>
        <h3 className={`text-lg font-semibold ${textTertiary} mb-2`}>Sin Resultados</h3>
        <p className={`text-sm ${textMuted}`}>
          Configure los parámetros y presione "Calcular Solución" para ver los resultados
        </p>
      </div>
    );
  }

  /* ── Build real result cards ── */
  const results = buildResultCards(apiResult);
  const tableRows = buildTableRows(apiResult);

  /* ── Extra data sections ── */
  const hasSolution = apiResult.solution && Array.isArray(apiResult.solution);
  const hasCoefficients = apiResult.coefficients && Array.isArray(apiResult.coefficients);
  const hasLU = apiResult.l_matrix && apiResult.u_matrix;
  const hasSplineCoeffs = apiResult.spline_coefficients;
  const hasJacobian = apiResult.jacobian || apiResult.jacobian_numeric;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Success banner */}
      {apiResult.message && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"}`}>
          <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
          <span className={`text-sm font-medium ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>{apiResult.message}</span>
        </div>
      )}

      {/* Dynamic Result Cards */}
      {results.length > 0 && (
        <div className={`grid gap-3 md:gap-4 ${
          results.length <= 2
            ? "grid-cols-1 sm:grid-cols-2"
            : results.length === 3
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }`}>
          {results.map((result, idx) => {
            const Icon = result.icon;
            const cyanColor = isDark ? "#22D3EE" : "#0891B2";
            const cyanBg = isDark ? "bg-[#22D3EE]/10" : "bg-[#0891B2]/10";
            const amberColor = isDark ? "#FBBF24" : "#D97706";
            const amberBg = isDark ? "bg-[#FBBF24]/10" : "bg-[#D97706]/10";

            let iconColor = "#3B82F6";
            let iconBg = "bg-[#3B82F6]/10";
            if (result.color === "cyan") { iconColor = cyanColor; iconBg = cyanBg; }
            if (result.color === "amber") { iconColor = amberColor; iconBg = amberBg; }

            return (
              <div key={idx} className={`${bgPrimary} rounded-xl border ${border} p-4 md:p-6 shadow-xl`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${iconBg}`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: iconColor }} />
                  </div>
                  <span className={`text-xs md:text-sm ${textSecondary}`}>{result.label}</span>
                </div>
                <div
                  className={`text-lg md:text-xl font-semibold ${textPrimary} break-all`}
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {result.value}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Solution vector */}
      {hasSolution && (
        <div className={`${bgPrimary} rounded-xl border ${border} shadow-xl p-4 md:p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDark ? "bg-[#22D3EE]/10" : "bg-[#0891B2]/10"}`}>
              <Grid3X3 className={`w-5 h-5 ${isDark ? "text-[#22D3EE]" : "text-[#0891B2]"}`} />
            </div>
            <h4 className={`text-sm font-semibold ${textPrimary}`}>Vector Solución</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {apiResult.solution.map((val: number, i: number) => (
              <span key={i} className={`px-3 py-1.5 rounded-lg ${bgSecondary} ${textPrimary} text-sm font-mono`}>
                x<sub>{i+1}</sub> = {Number(val).toPrecision(6)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* L/U Matrices */}
      {hasLU && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[{label: "Matriz L", data: apiResult.l_matrix}, {label: "Matriz U", data: apiResult.u_matrix}].map(({label, data}) => (
            <div key={label} className={`${bgPrimary} rounded-xl border ${border} shadow-xl p-4 md:p-6`}>
              <h4 className={`text-sm font-semibold ${textPrimary} mb-3`}>{label}</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {data.map((row: number[], ri: number) => (
                      <tr key={ri}>
                        {row.map((v: number, ci: number) => (
                          <td key={ci} className={`px-2 py-1 text-xs text-center font-mono ${textSecondary}`}>
                            {Number(v).toPrecision(4)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coefficients */}
      {hasCoefficients && (
        <div className={`${bgPrimary} rounded-xl border ${border} shadow-xl p-4 md:p-6`}>
          <h4 className={`text-sm font-semibold ${textPrimary} mb-3`}>Coeficientes</h4>
          <div className="flex flex-wrap gap-2">
            {apiResult.coefficients.map((c: number, i: number) => (
              <span key={i} className={`px-3 py-1.5 rounded-lg ${bgSecondary} ${textPrimary} text-sm font-mono`}>
                a<sub>{i}</sub> = {Number(c).toPrecision(6)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Spline Coefficients */}
      {hasSplineCoeffs && (
        <div className={`${bgPrimary} rounded-xl border ${border} shadow-xl p-4 md:p-6`}>
          <h4 className={`text-sm font-semibold ${textPrimary} mb-3`}>Coeficientes del Spline</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={bgTableRow}>
                <tr>
                  {["i", "a", "b", "c", "d"].map(h => (
                    <th key={h} className={`px-3 py-2 text-xs font-semibold ${textMuted} uppercase`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apiResult.spline_coefficients.a.map((_: number, i: number) => (
                  <tr key={i} className={bgTableHover}>
                    <td className={`px-3 py-2 text-xs font-mono text-center ${textTertiary}`}>{i}</td>
                    {["a","b","c","d"].map(k => (
                      <td key={k} className={`px-3 py-2 text-xs font-mono text-center ${textSecondary}`}>
                        {Number(apiResult.spline_coefficients[k][i]).toPrecision(4)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Jacobian */}
      {hasJacobian && (
        <div className={`${bgPrimary} rounded-xl border ${border} shadow-xl p-4 md:p-6`}>
          <h4 className={`text-sm font-semibold ${textPrimary} mb-3`}>Jacobiano</h4>
          {apiResult.jacobian && (
            <p className={`text-sm font-mono ${textSecondary} mb-3 break-all`}>{apiResult.jacobian}</p>
          )}
          {apiResult.jacobian_numeric && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {apiResult.jacobian_numeric.map((row: number[], ri: number) => (
                    <tr key={ri}>
                      {row.map((v: number, ci: number) => (
                        <td key={ci} className={`px-2 py-1 text-xs text-center font-mono ${textSecondary}`}>
                          {Number(v).toPrecision(4)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ODE / Iteration Data Table */}
      {tableRows && tableRows.length > 0 && (
        <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}>
          <button
            onClick={() => setShowTable(!showTable)}
            className={`w-full bg-gradient-to-r ${bgGradient} px-4 md:px-6 py-3 md:py-4 border-b ${borderSecondary} flex items-center justify-between ${bgHover} transition-all`}
          >
            <div>
              <h3 className={`text-sm md:text-base font-semibold ${textPrimary} text-left`}>
                Tabla de Valores
              </h3>
              <p className={`text-xs md:text-sm ${textSecondary} mt-1 text-left`}>
                {tableRows.length} puntos calculados
              </p>
            </div>
            {showTable ? (
              <ChevronUp className={`w-5 h-5 ${textSecondary} flex-shrink-0`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${textSecondary} flex-shrink-0`} />
            )}
          </button>

          {showTable && (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className={`${bgTableRow} sticky top-0`}>
                  <tr>
                    {Object.keys(tableRows[0]).map(key => (
                      <th key={key} className={`px-3 md:px-6 py-2 md:py-3 text-left text-xs font-semibold ${textMuted} uppercase tracking-wider`}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-[#1E293B]" : "divide-[#E2E8F0]"}`}>
                  {tableRows.map((row, idx) => (
                    <tr key={idx} className={`transition-colors ${idx === tableRows.length - 1
                      ? isDark ? "bg-gradient-to-r from-[#22D3EE]/10 to-transparent" : "bg-gradient-to-r from-[#0891B2]/10 to-transparent"
                      : bgTableHover
                    }`}>
                      {Object.values(row).map((val, ci) => (
                        <td key={ci} className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm ${textSecondary}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {String(val)}
                        </td>
                      ))}
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
