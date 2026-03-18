import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Scatter, ScatterChart } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

import { CalculationResponse } from '../api/calculator';

interface GraphPanelProps {
  hasResults: boolean;
  apiResult: CalculationResponse | null;
}

export function GraphPanel({ hasResults, apiResult }: GraphPanelProps) {
  const [showGraph, setShowGraph] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bgPrimary = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const bgSecondary = isDark ? 'bg-[#1E293B]/40' : 'bg-[#F1F5F9]';
  const bgGradient = isDark ? 'from-[#1E293B] to-[#334155]/50' : 'from-[#E2E8F0] to-[#F1F5F9]';
  const bgHover = isDark ? 'hover:from-[#334155]/60 hover:to-[#334155]/40' : 'hover:from-[#CBD5E1] hover:to-[#E2E8F0]';
  const textPrimary = isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]';
  const textSecondary = isDark ? 'text-[#94A3B8]' : 'text-[#475569]';
  const textTertiary = isDark ? 'text-[#CBD5E1]' : 'text-[#334155]';
  const border = isDark ? 'border-[#1E293B]' : 'border-[#E2E8F0]';
  const borderSecondary = isDark ? 'border-[#334155]' : 'border-[#CBD5E1]';
  const borderChart = isDark ? '#334155' : '#E2E8F0';
  const gridColor = isDark ? '#334155' : '#CBD5E1';
  const axisColor = isDark ? '#64748B' : '#94A3B8';
  const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#CBD5E1';
  const tooltipText = isDark ? '#F8FAFC' : '#0F172A';

  if (!hasResults || !apiResult) {
    return null;
  }

  // Extraer datos de la API para la gráfica general f(x)
  const functionData = apiResult.coordinates || [];

  // Puntos específicos (iteraciones de ecuaciones dif. o pares (x,y) introducidos en interpolación)
  let iterationPoints: Array<{x: number, y: number}> = [];
  if (apiResult.x_values && apiResult.y_values) {
    iterationPoints = apiResult.x_values.map((xVal, idx) => ({
      x: xVal,
      y: apiResult.y_values![idx]
    }));
  }

  // Raíz o resultado calculado para trazar la línea de referencia
  const rootValue = typeof apiResult.result === 'number' ? apiResult.result : null;

  return (
    <div className={`${bgPrimary} rounded-xl border ${border} shadow-2xl overflow-hidden`}>
      <button
        onClick={() => setShowGraph(!showGraph)}
        className={`w-full bg-gradient-to-r ${bgGradient} px-6 py-4 border-b ${borderSecondary} flex items-center justify-between ${bgHover} transition-all`}
      >
        <div>
          <h3 className={`text-base font-semibold ${textPrimary} text-left`}>Visualización Gráfica</h3>
          <p className={`text-sm ${textSecondary} mt-1 text-left`}>
            Gráfica de la función y proceso de convergencia
          </p>
        </div>
        {showGraph ? (
          <ChevronUp className={`w-5 h-5 ${textSecondary}`} />
        ) : (
          <ChevronDown className={`w-5 h-5 ${textSecondary}`} />
        )}
      </button>

      {showGraph && (
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Function Plot */}
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

            {/* Iteration Points Visualization */}
            <div className={`${bgSecondary} rounded-lg p-4 border ${borderChart}`}>
              <h4 className={`text-sm font-semibold ${textTertiary} mb-3`}>Puntos de Iteración</h4>
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    stroke={axisColor}
                    tick={{ fill: axisColor, fontSize: 12 }}
                    axisLine={{ stroke: gridColor }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
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
                    cursor={{ strokeDasharray: '3 3' }}
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
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] rounded"></div>
              <span className={textSecondary}>Función f(x)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div>
              <span className={textSecondary}>Puntos de iteración</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-1 ${isDark ? 'bg-[#22D3EE]' : 'bg-[#0891B2]'} rounded`} style={{ borderStyle: 'dashed' }}></div>
              <span className={textSecondary}>Raíz aproximada</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
