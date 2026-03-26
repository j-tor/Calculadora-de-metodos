import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  ScatterChart,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { CalculationResponse } from "./DynamicResultsPanel";

interface GraphPanelProps {
  hasResults: boolean;
  apiResult: CalculationResponse | null;
  selectedMethod: string;
}

export function GraphPanel({ selectedMethod, hasResults, apiResult }: GraphPanelProps) {
  const [showGraph, setShowGraph] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bgPrimary = isDark ? "bg-[#0F172A]" : "bg-white";
  const bgSecondary = isDark ? "bg-[#1E293B]/40" : "bg-[#F1F5F9]";
  const bgGradient = isDark
    ? "from-[#1E293B] to-[#334155]/50"
    : "from-[#E2E8F0] to-[#F1F5F9]";
  const bgHover = isDark
    ? "hover:from-[#334155]/60 hover:to-[#334155]/40"
    : "hover:from-[#CBD5E1] hover:to-[#E2E8F0]";
  const textPrimary = isDark ? "text-[#F8FAFC]" : "text-[#0F172A]";
  const textSecondary = isDark ? "text-[#94A3B8]" : "text-[#475569]";
  const textTertiary = isDark ? "text-[#CBD5E1]" : "text-[#334155]";
  const border = isDark ? "border-[#1E293B]" : "border-[#E2E8F0]";
  const borderSecondary = isDark ? "border-[#334155]" : "border-[#CBD5E1]";
  const borderChart = isDark ? "#334155" : "#E2E8F0";
  const gridColor = isDark ? "#334155" : "#CBD5E1";
  const axisColor = isDark ? "#64748B" : "#94A3B8";
  const tooltipBg = isDark ? "#1E293B" : "#FFFFFF";
  const tooltipBorder = isDark ? "#334155" : "#CBD5E1";
  const tooltipText = isDark ? "#F8FAFC" : "#0F172A";
  const isInterpolationMethod = ["lagrange", "newton-divided", "cubic-spline"].includes(selectedMethod);
  const isRootMethod = ["bisection", "newton", "fixed-point"].includes(selectedMethod);
  const isLuMethod = selectedMethod === "lu";
  const isJacobiOrGaussSeidel = ["jacobi", "gauss-seidel"].includes(selectedMethod);
  const isOdeMethod = ["euler", "verlet", "rk4"].includes(selectedMethod);

  if (!hasResults || !apiResult) {
    return null;
  }

  const functionData = apiResult.coordinates || [];

  let iterationPoints: Array<{ x: number; y: number }> = [];
  if (apiResult.x_values && apiResult.y_values) {
    iterationPoints = apiResult.x_values.map((xVal, idx) => ({
      x: xVal,
      y: apiResult.y_values![idx],
    }));
  }

  const rootValue =
    typeof apiResult.result === "number" ? apiResult.result : null;
  const xEval = typeof apiResult.x_eval === "number" ? apiResult.x_eval : null;
  const yEval = typeof apiResult.value === "number" ? apiResult.value : null;

  const sampleCurve = () => {
    if (!apiResult.x_values || !apiResult.y_values || apiResult.x_values.length < 2) {
      return [];
    }
    const xs = apiResult.x_values;
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const pointsCount = 120;
    const step = (xMax - xMin) / (pointsCount - 1 || 1);

    if (selectedMethod === "lagrange" && apiResult.x_values && apiResult.y_values) {
      const xVals = apiResult.x_values;
      const yVals = apiResult.y_values;
      const evalLagrange = (x: number) => {
        let total = 0;
        for (let i = 0; i < xVals.length; i += 1) {
          let term = yVals[i];
          for (let j = 0; j < xVals.length; j += 1) {
            if (i !== j) term *= (x - xVals[j]) / (xVals[i] - xVals[j]);
          }
          total += term;
        }
        return total;
      };
      return Array.from({ length: pointsCount }, (_, i) => {
        const x = xMin + i * step;
        return { x, y: evalLagrange(x) };
      });
    }

    if (selectedMethod === "newton-divided" && apiResult.coefficients && apiResult.x_values) {
      const coef = apiResult.coefficients;
      const xVals = apiResult.x_values;
      const evalNewton = (x: number) => {
        let result = coef[0] ?? 0;
        let product = 1;
        for (let k = 1; k < coef.length; k += 1) {
          product *= (x - xVals[k - 1]);
          result += coef[k] * product;
        }
        return result;
      };
      return Array.from({ length: pointsCount }, (_, i) => {
        const x = xMin + i * step;
        return { x, y: evalNewton(x) };
      });
    }

    if (selectedMethod === "cubic-spline" && apiResult.spline_coefficients && apiResult.x_values) {
      const xVals = apiResult.x_values;
      const { a = [], b = [], c = [], d = [] } = apiResult.spline_coefficients;
      const evalSpline = (x: number) => {
        let idx = xVals.length - 2;
        for (let i = 0; i < xVals.length - 1; i += 1) {
          if (x >= xVals[i] && x <= xVals[i + 1]) {
            idx = i;
            break;
          }
        }
        const dx = x - xVals[idx];
        return (a[idx] ?? 0) + (b[idx] ?? 0) * dx + (c[idx] ?? 0) * dx * dx + (d[idx] ?? 0) * dx * dx * dx;
      };
      return Array.from({ length: pointsCount }, (_, i) => {
        const x = xMin + i * step;
        return { x, y: evalSpline(x) };
      });
    }

    return [];
  };

  const interpolationCurve = sampleCurve();
  const interpolationPoints = (apiResult.x_values && apiResult.y_values)
    ? apiResult.x_values.map((x, idx) => ({ x, y: apiResult.y_values?.[idx] ?? 0 }))
    : [];

  return (
    <div
      className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}
    >
      <button
        onClick={() => setShowGraph(!showGraph)}
        className={`w-full bg-gradient-to-r ${bgGradient} px-4 md:px-6 py-3 md:py-4 border-b ${borderSecondary} flex items-center justify-between ${bgHover} transition-all`}
      >
        <div>
          <h3
            className={`text-sm md:text-base font-semibold ${textPrimary} text-left`}
          >
            {isInterpolationMethod
              ? "Gráfica de Interpolación"
              : isLuMethod
                ? "Descomposición LU"
                : isJacobiOrGaussSeidel
                  ? "Convergencia (Error vs Iteración)"
                  : isOdeMethod
                    ? "Trayectoria de la Solución ODE"
                    : "Visualización Gráfica"}
          </h3>
          <p className={`text-xs md:text-sm ${textSecondary} mt-1 text-left`}>
            {isInterpolationMethod
              ? "Curva interpolada y puntos de entrada"
              : isLuMethod
                ? "Matriz L, Matriz U y solución"
                : isJacobiOrGaussSeidel
                  ? "Error por iteración (escala log)"
                  : isOdeMethod
                    ? selectedMethod === "verlet" ? "Posición y(x) y velocidad v(x) vs tiempo" : "y(x) vs x"
                    : "Gráfica de la función y proceso de convergencia"}
          </p>
        </div>
        {showGraph ? (
          <ChevronUp className={`w-5 h-5 ${textSecondary} flex-shrink-0`} />
        ) : (
          <ChevronDown className={`w-5 h-5 ${textSecondary} flex-shrink-0`} />
        )}
      </button>

      {showGraph && (
        <div className="p-6">
          {isLuMethod ? (
            <div className="space-y-4">
              {Array.isArray(apiResult.l_matrix) && apiResult.l_matrix.length > 0 && (
                <div
                  className={`${bgSecondary} rounded-lg p-4 border ${borderChart}`}
                  style={{ borderLeft: `3px solid #3B82F6` }}
                >
                  <h4 className={`text-sm font-semibold ${textTertiary} mb-3`}>Matriz L</h4>
                  {(() => {
                    const L = apiResult.l_matrix as number[][];
                    const rows = L.length;
                    const cols = L[0]?.length ?? 0;
                    const luCellTextColor = isDark ? "#F8FAFC" : "#0F172A";
                    const luHeaderTextColor = isDark ? "#64748B" : "#475569";
                    const gridCells: JSX.Element[] = [];

                    // Top-left corner
                    gridCells.push(
                      <div
                        key="corner"
                        className="py-2 px-4 text-center"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          border: `1px solid ${borderChart}`,
                          color: luHeaderTextColor,
                        }}
                      />
                    );

                    // Column headers
                    for (let cIdx = 0; cIdx < cols; cIdx += 1) {
                      gridCells.push(
                        <div
                          key={`col-${cIdx}`}
                          className="py-2 px-4 text-center"
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            border: `1px solid ${borderChart}`,
                            color: luHeaderTextColor,
                          }}
                        >
                          C{cIdx + 1}
                        </div>
                      );
                    }

                    // Rows + values
                    for (let rIdx = 0; rIdx < rows; rIdx += 1) {
                      gridCells.push(
                        <div
                          key={`row-${rIdx}-label`}
                          className="py-2 px-4 text-center"
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            border: `1px solid ${borderChart}`,
                            color: luHeaderTextColor,
                          }}
                        >
                          F{rIdx + 1}
                        </div>
                      );

                      for (let cIdx = 0; cIdx < cols; cIdx += 1) {
                        const val = L[rIdx]?.[cIdx] ?? 0;
                        gridCells.push(
                          <div
                            key={`row-${rIdx}-col-${cIdx}`}
                            className="py-2 px-4 text-center"
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              border: `1px solid ${borderChart}`,
                              color: luCellTextColor,
                            }}
                          >
                            {Number(val).toFixed(6)}
                          </div>
                        );
                      }
                    }

                    return (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: `auto repeat(${cols}, minmax(0, 1fr))`,
                          gap: 0,
                        }}
                      >
                        {gridCells}
                      </div>
                    );
                  })()}
                </div>
              )}

              {Array.isArray(apiResult.u_matrix) && apiResult.u_matrix.length > 0 && (
                <div
                  className={`${bgSecondary} rounded-lg p-4 border ${borderChart}`}
                  style={{ borderLeft: `3px solid #22D3EE` }}
                >
                  <h4 className={`text-sm font-semibold ${textTertiary} mb-3`}>Matriz U</h4>
                  {(() => {
                    const U = apiResult.u_matrix as number[][];
                    const rows = U.length;
                    const cols = U[0]?.length ?? 0;
                    const luCellTextColor = isDark ? "#F8FAFC" : "#0F172A";
                    const luHeaderTextColor = isDark ? "#64748B" : "#475569";
                    const gridCells: JSX.Element[] = [];

                    // Top-left corner
                    gridCells.push(
                      <div
                        key="corner"
                        className="py-2 px-4 text-center"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          border: `1px solid ${borderChart}`,
                          color: luHeaderTextColor,
                        }}
                      />
                    );

                    // Column headers
                    for (let cIdx = 0; cIdx < cols; cIdx += 1) {
                      gridCells.push(
                        <div
                          key={`col-${cIdx}`}
                          className="py-2 px-4 text-center"
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            border: `1px solid ${borderChart}`,
                            color: luHeaderTextColor,
                          }}
                        >
                          C{cIdx + 1}
                        </div>
                      );
                    }

                    // Rows + values
                    for (let rIdx = 0; rIdx < rows; rIdx += 1) {
                      gridCells.push(
                        <div
                          key={`row-${rIdx}-label`}
                          className="py-2 px-4 text-center"
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            border: `1px solid ${borderChart}`,
                            color: luHeaderTextColor,
                          }}
                        >
                          F{rIdx + 1}
                        </div>
                      );

                      for (let cIdx = 0; cIdx < cols; cIdx += 1) {
                        const val = U[rIdx]?.[cIdx] ?? 0;
                        gridCells.push(
                          <div
                            key={`row-${rIdx}-col-${cIdx}`}
                            className="py-2 px-4 text-center"
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              border: `1px solid ${borderChart}`,
                              color: luCellTextColor,
                            }}
                          >
                            {Number(val).toFixed(6)}
                          </div>
                        );
                      }
                    }

                    return (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: `auto repeat(${cols}, minmax(0, 1fr))`,
                          gap: 0,
                        }}
                      >
                        {gridCells}
                      </div>
                    );
                  })()}
                </div>
              )}

              {Array.isArray(apiResult.solution) && apiResult.solution.length > 0 && (
                <div className={`${bgSecondary} rounded-lg p-4 border ${borderChart}`}>
                  <h4 className={`text-sm font-semibold ${textTertiary} mb-3`}>Vector x</h4>
                  <div className="overflow-x-auto">
                    <div
                      className="grid gap-1"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {apiResult.solution.map((val, idx) => (
                        <div
                          key={idx}
                          className={`px-4 py-2 text-center border ${borderChart} rounded`}
                          style={{ color: isDark ? "#F8FAFC" : "#0F172A" }}
                        >
                          x<sub>{idx + 1}</sub> = {Number(val).toFixed(6)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : isJacobiOrGaussSeidel ? (
            (() => {
              const errors = Array.isArray(apiResult.errors) ? apiResult.errors : [];
              const tolerance = typeof (apiResult as any).tolerance === "number" ? (apiResult as any).tolerance : null;
              const eps = 1e-20;
              const data = errors.map((err, idx) => {
                const eAbs = Math.abs(Number(err));
                return {
                  iteration: idx + 1,
                  error: Number(err),
                  logError: Math.log10(eAbs + eps),
                };
              });
              const tolLog = tolerance != null && tolerance > 0 ? Math.log10(tolerance) : null;

              return (
                <div className={`${bgSecondary} rounded-lg p-4 border ${borderChart}`}>
                  <ResponsiveContainer width="100%" height={380}>
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="convGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#22D3EE" />
                          <stop offset="100%" stopColor="#0891B2" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
                      <XAxis dataKey="iteration" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                      <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: tooltipBg,
                          border: `1px solid ${tooltipBorder}`,
                          borderRadius: "8px",
                          color: tooltipText,
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: tooltipText }}
                        formatter={(value: any, name: any) => {
                          if (name === "logError") return [value, "log10(error)"];
                          if (name === "error") return [value, "error"];
                          return [value, name];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="logError"
                        stroke="url(#convGradient)"
                        strokeWidth={3}
                        dot={false}
                        isAnimationActive={false}
                      />
                      {tolLog != null && (
                        <ReferenceLine
                          y={tolLog}
                          stroke={isDark ? "#22D3EE" : "#0891B2"}
                          strokeDasharray="6 6"
                          label={{
                            value: `tol=${tolerance}`,
                            fill: isDark ? "#22D3EE" : "#0891B2",
                            fontSize: 11,
                          }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()
          ) : isInterpolationMethod ? (
            <div className={`${bgSecondary} rounded-lg p-4 border ${borderChart}`}>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={interpolationCurve} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="interpLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor={isDark ? "#22D3EE" : "#0891B2"} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
                  <XAxis dataKey="x" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px", color: tooltipText, fontFamily: "JetBrains Mono, monospace" }}
                    labelStyle={{ color: tooltipText }}
                  />
                  <Line type="monotone" dataKey="y" stroke="url(#interpLineGradient)" strokeWidth={3} dot={false} isAnimationActive={false} />
                  <Scatter data={interpolationPoints} fill="#F97316" />
                  {xEval !== null && yEval !== null && (
                    <Scatter data={[{ x: xEval, y: yEval }]} fill="#10B981" />
                  )}
                  {xEval !== null && (
                    <ReferenceLine
                      x={xEval}
                      stroke={isDark ? "#22D3EE" : "#0891B2"}
                      strokeDasharray="5 5"
                      label={{ value: yEval !== null ? `x_eval=${xEval.toFixed(3)}, y=${yEval.toFixed(3)}` : `x_eval=${xEval.toFixed(3)}`, fill: isDark ? "#22D3EE" : "#0891B2", fontSize: 11 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : isOdeMethod ? (
            <div className={`${bgSecondary} rounded-lg p-4 border ${borderChart}`}>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart
                  data={iterationPoints}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="odeGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor={isDark ? "#22D3EE" : "#0891B2"} />
                    </linearGradient>
                    <linearGradient id="odeVelGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F97316" />
                      <stop offset="100%" stopColor="#FBBF24" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
                  <XAxis dataKey="x" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} label={{ value: 'x', position: 'insideBottomRight', offset: -5, fill: axisColor }} />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tooltipText, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                    labelStyle={{ color: tooltipText }}
                    formatter={(value: any, name: any) => [
                      typeof value === 'number' ? value.toFixed(6) : value,
                      name === 'y' ? 'y(x)' : 'v(x)',
                    ]}
                  />
                  <Line type="monotone" dataKey="y" stroke="url(#odeGradient)" strokeWidth={3} dot={false} isAnimationActive={false} name="y" />
                  {selectedMethod === "verlet" && apiResult.v_values && (() => {
                    const verletData = apiResult.x_values!.map((xv, i) => ({ x: xv, y: (apiResult.v_values as number[])[i] }));
                    return (
                      <Line type="monotone" data={verletData} dataKey="y" stroke="url(#odeVelGradient)" strokeWidth={2} dot={false} strokeDasharray="5 5" isAnimationActive={false} name="v" />
                    );
                  })()}
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-4 justify-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] rounded" />
                  <span className={textSecondary}>y(x) — posición</span>
                </div>
                {selectedMethod === "verlet" && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-[#F97316] to-[#FBBF24] rounded" style={{ borderTop: '2px dashed #F97316' }} />
                    <span className={textSecondary}>v(x) — velocidad</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
          <div className={`grid gap-4 ${
            isRootMethod && selectedMethod !== "bisection" 
              ? "grid-cols-1 lg:grid-cols-2" 
              : "grid-cols-1"
          }`}>
            {/* Function Plot */}
            {isRootMethod && selectedMethod !== "bisection" && (
              <div className={`${bgSecondary} rounded-lg p-4 border ${borderChart}`}>
                <h4 className={`text-sm font-semibold ${textTertiary} mb-3`}>Gráfica de la Función</h4>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={functionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor={isDark ? "#22D3EE" : "#0891B2"} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
                    <XAxis
                      dataKey="x"
                      stroke={axisColor}
                      tick={{ fill: axisColor, fontSize: 12 }}
                      axisLine={{ stroke: gridColor }}
                    />
                    <YAxis
                      stroke={axisColor}
                      tick={{ fill: axisColor, fontSize: 12 }}
                      axisLine={{ stroke: gridColor }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: '8px',
                        color: tooltipText,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                      labelStyle={{ color: tooltipText }}
                    />
                    <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" />
                    {rootValue !== null && (
                       <ReferenceLine x={rootValue} stroke={isDark ? "#22D3EE" : "#0891B2"} strokeDasharray="5 5" label={{ value: 'Raíz', fill: isDark ? "#22D3EE" : "#0891B2", fontSize: 12 }} />
                    )}
                    <Line
                      type="monotone"
                      dataKey="y"
                      stroke="url(#lineGradient)"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Iteration Points Visualization */}
            {isRootMethod && (
            <div
              className={`${bgSecondary} rounded-lg p-3 md:p-4 border ${borderChart}`}
            >
              <h4
                className={`text-xs md:text-sm font-semibold ${textTertiary} mb-3`}
              >
                Puntos de Iteración
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    opacity={0.3}
                  />
                  <XAxis
                    type="number"
                    dataKey="x"
                    stroke={axisColor}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={{ stroke: gridColor }}
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    stroke={axisColor}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={{ stroke: gridColor }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: "8px",
                      color: tooltipText,
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "12px",
                    }}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Scatter
                    name="Iteraciones"
                    data={iterationPoints}
                    fill="#3B82F6"
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            )}
          </div>
          )}

          {!isInterpolationMethod && isRootMethod && (
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-center text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] rounded"></div>
              <span className={textSecondary}>Función f(x)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div>
              <span className={textSecondary}>Puntos de iteración</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-1 ${
                  isDark ? "bg-[#22D3EE]" : "bg-[#0891B2]"
                } rounded`}
                style={{ borderStyle: "dashed" }}
              ></div>
              <span className={textSecondary}>Raíz aproximada</span>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
