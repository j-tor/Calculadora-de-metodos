import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

type Cell = number | null;

function parseMatrixString(s: string | undefined): number[][] | null {
  if (!s?.trim()) return null;
  const rows = s
    .split(';')
    .map((row) => row.trim())
    .filter(Boolean);
  const m: number[][] = [];
  for (const row of rows) {
    const parts = row.split(',').map((p) => p.trim()).filter(Boolean);
    const nums = parts.map((p) => Number(p.replace(',', '.')));
    if (parts.length === 0 || nums.some((x) => !Number.isFinite(x))) return null;
    m.push(nums);
  }
  if (m.length === 0) return null;
  const w = m[0].length;
  if (!m.every((r) => r.length === w)) return null;
  return m;
}

function parseVectorString(s: string | undefined): number[] | null {
  if (!s?.trim()) return null;
  const parts = s.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const nums = parts.map((p) => Number(p.replace(',', '.')));
  if (nums.some((x) => !Number.isFinite(x))) return null;
  return nums;
}

function cellToNum(c: Cell): number {
  return c === null ? 0 : c;
}

function serializeMatrixCells(m: Cell[][]): string {
  return m.map((row) => row.map((x) => String(cellToNum(x))).join(',')).join(';');
}

function serializeVectorCells(v: Cell[]): string {
  return v.map((x) => String(cellToNum(x))).join(',');
}

function resizeSquare(m: Cell[][], n: number): Cell[][] {
  const out: Cell[][] = [];
  for (let i = 0; i < n; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < n; j++) {
      if (i < m.length && j < m[i].length) row.push(m[i][j]);
      else row.push(null);
    }
    out.push(row);
  }
  return out;
}

function resizeFromParsed(pm: number[][], n: number): Cell[][] {
  const out: Cell[][] = [];
  for (let i = 0; i < n; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < n; j++) {
      if (i < pm.length && j < pm[i].length) row.push(pm[i][j]);
      else row.push(null);
    }
    out.push(row);
  }
  return out;
}

function resizeVector(v: Cell[], n: number): Cell[] {
  const out: Cell[] = [];
  for (let i = 0; i < n; i++) out.push(i < v.length ? v[i] : null);
  return out;
}

function vectorFromParsed(pv: number[], n: number): Cell[] {
  const out: Cell[] = [];
  for (let i = 0; i < n; i++) out.push(i < pv.length ? pv[i] : null);
  return out;
}

interface MatrixVectorInputsProps {
  matrixStr: string;
  vectorStr: string;
  onMatrixChange: (s: string) => void;
  onVectorChange: (s: string) => void;
  optionalVector?: boolean;
  matrixError?: string;
  vectorError?: string;
}

export function MatrixVectorInputs({
  matrixStr,
  vectorStr,
  onMatrixChange,
  onVectorChange,
  optionalVector,
  matrixError,
  vectorError,
}: MatrixVectorInputsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bgSecondary = isDark ? 'bg-[#1E293B]' : 'bg-[#F1F5F9]';
  const textPrimary = isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]';
  const textTertiary = isDark ? 'text-[#CBD5E1]' : 'text-[#334155]';
  const borderSecondary = isDark ? 'border-[#334155]' : 'border-[#CBD5E1]';
  const errRing = 'border-red-500 ring-2 ring-red-500/25';
  const [n, setN] = useState(3);
  const [matrix, setMatrix] = useState<Cell[][]>(() => resizeSquare([], 3));
  const [vector, setVector] = useState<Cell[]>(() => resizeVector([], 3));

  const lastMatrixOut = useRef<string | null>(null);
  const lastVectorOut = useRef<string | null>(null);

  useEffect(() => {
    const echo =
      lastMatrixOut.current !== null &&
      lastVectorOut.current !== null &&
      matrixStr === lastMatrixOut.current &&
      vectorStr === lastVectorOut.current;
    if (echo) return;

    lastMatrixOut.current = matrixStr;
    lastVectorOut.current = vectorStr;

    const pm = parseMatrixString(matrixStr);
    const pv = parseVectorString(vectorStr);
    const size = pm?.length ?? (pv?.length ?? 3);
    const nn = Math.min(12, Math.max(2, size));
    setN(nn);
    if (pm) setMatrix(resizeFromParsed(pm, nn));
    else setMatrix(resizeSquare([], nn));
    if (pv) setVector(vectorFromParsed(pv, nn));
    else setVector(resizeVector([], nn));
  }, [matrixStr, vectorStr]);

  const pushMatrix = (next: Cell[][]) => {
    setMatrix(next);
    const s = serializeMatrixCells(next);
    lastMatrixOut.current = s;
    onMatrixChange(s);
  };

  const pushVector = (next: Cell[]) => {
    setVector(next);
    if (optionalVector && next.every((x) => x === null)) {
      lastVectorOut.current = '';
      onVectorChange('');
      return;
    }
    const s = serializeVectorCells(next);
    lastVectorOut.current = s;
    onVectorChange(s);
  };

  const handleN = (nextN: number) => {
    const nn = Math.min(12, Math.max(2, nextN));
    setN(nn);
    const nm = resizeSquare(matrix, nn);
    const nv = resizeVector(vector, nn);
    setMatrix(nm);
    setVector(nv);
    const ms = serializeMatrixCells(nm);
    lastMatrixOut.current = ms;
    onMatrixChange(ms);
    if (optionalVector && nv.every((x) => x === null)) {
      lastVectorOut.current = '';
      onVectorChange('');
    } else {
      const vs = serializeVectorCells(nv);
      lastVectorOut.current = vs;
      onVectorChange(vs);
    }
  };

  const cellClass = (bad?: boolean) =>
    `min-w-0 w-full ${bgSecondary} border ${bad ? errRing : borderSecondary} rounded-lg px-2 py-2 ${textPrimary} text-center text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className={`text-sm font-medium ${textTertiary}`}>Tamaño (n)</label>
        <input
          type="number"
          min={2}
          max={12}
          value={n}
          onChange={(e) => {
            const raw = Number(e.target.value);
            if (!Number.isFinite(raw)) return;
            handleN(Math.round(raw));
          }}
          className={`w-20 ${bgSecondary} border ${matrixError || vectorError ? errRing : borderSecondary} rounded-lg px-2 py-2 ${textPrimary} text-center`}
        />
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div>
          <p className={`text-sm font-medium ${textTertiary} mb-2`}>Matriz A</p>
          {matrixError ? (
            <p className="text-red-500 text-xs mb-2" role="alert">
              {matrixError}
            </p>
          ) : null}
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(3rem, 1fr))` }}
          >
            {matrix.map((row, i) =>
              row.map((cell, j) => (
                <input
                  key={`${i}-${j}`}
                  type="number"
                  step="any"
                  placeholder="ej. 0"
                  value={cell === null ? '' : cell}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const next = matrix.map((r) => [...r]);
                    if (raw === '') next[i][j] = null;
                    else {
                      const v = Number(raw);
                      next[i][j] = Number.isFinite(v) ? v : null;
                    }
                    pushMatrix(next);
                  }}
                  className={cellClass(!!matrixError)}
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <p className={`text-sm font-medium ${textTertiary} mb-2`}>Vector b</p>
          {vectorError ? (
            <p className="text-red-500 text-xs mb-2" role="alert">
              {vectorError}
            </p>
          ) : null}
          <div className="flex flex-col gap-1.5">
            {vector.map((cell, i) => (
              <input
                key={i}
                type="number"
                step="any"
                placeholder="ej. 0"
                value={cell === null ? '' : cell}
                onChange={(e) => {
                  const raw = e.target.value;
                  const next = [...vector];
                  if (raw === '') next[i] = null;
                  else {
                    const v = Number(raw);
                    next[i] = Number.isFinite(v) ? v : null;
                  }
                  pushVector(next);
                }}
                className={`${cellClass(!!vectorError)} min-w-[4.5rem]`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
