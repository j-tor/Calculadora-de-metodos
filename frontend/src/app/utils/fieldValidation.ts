import { methodParameters } from "../config/methodParameters";

const EQUATION_METHODS = new Set(["newton", "bisection", "fixed-point"]);
const MATRIX_METHODS = new Set(["jacobi", "gauss-seidel", "lu"]);

function parseMatrix(s: string | undefined): number[][] | null {
  if (!s?.trim()) return null;
  const rows = s
    .split(";")
    .map((row) => row.trim())
    .filter(Boolean);
  const m: number[][] = [];
  for (const row of rows) {
    const parts = row
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const nums = parts.map((p) => Number(p.replace(",", ".")));
    if (parts.length === 0 || nums.some((x) => !Number.isFinite(x))) return null;
    m.push(nums);
  }
  if (m.length === 0) return null;
  const w = m[0].length;
  if (!m.every((r) => r.length === w)) return null;
  return m;
}

function parseVector(s: string | undefined): number[] | null {
  if (!s?.trim()) return null;
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const nums = parts.map((p) => Number(p.replace(",", ".")));
  if (nums.some((x) => !Number.isFinite(x))) return null;
  return nums;
}

function parseCommaNumbers(s: string): number[] | null {
  if (!s.trim()) return null;
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const nums = parts.map((p) => Number(p.replace(",", ".")));
  if (nums.some((x) => !Number.isFinite(x))) return null;
  return nums;
}

function errRequired(label: string) {
  return `${label}: obligatorio`;
}

function validateFiniteNumber(value: string, label: string): string | null {
  const t = value.trim();
  if (t === "") return errRequired(label);
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n)) return `${label}: debe ser un número válido`;
  return null;
}

function validatePositiveFinite(value: string, label: string): string | null {
  const base = validateFiniteNumber(value, label);
  if (base) return base;
  const n = Number(value.trim().replace(",", "."));
  if (n <= 0) return `${label}: debe ser mayor que 0`;
  return null;
}

function validatePositiveInt(value: string, label: string): string | null {
  const base = validateFiniteNumber(value, label);
  if (base) return base;
  const n = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 1) return `${label}: entero ≥ 1`;
  if (!Number.isInteger(n) && Math.abs(n - Math.round(n)) > 1e-9) {
    return `${label}: debe ser un número entero`;
  }
  return null;
}

export function validateCalculatorInput(
  method: string,
  values: Record<string, string>,
  equation: string
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (EQUATION_METHODS.has(method) && !equation.trim()) {
    errors.equation = "Ingrese la función f(x)";
  }

  const params = methodParameters[method] || methodParameters["newton"];

  for (const param of params) {
    if (MATRIX_METHODS.has(method) && param.name === "vectorB") continue;

    const v = values[param.name] ?? "";
    const label = param.label;

    if (param.name === "matrixA" && MATRIX_METHODS.has(method)) {
      const m = parseMatrix(v);
      if (!m) {
        errors.matrixA = "Matriz inválida: use filas separadas por ; y números por ,";
        continue;
      }
      if (m.length < 2) {
        errors.matrixA = "La matriz debe tener al menos 2 filas";
      }

      const vecRaw = values.vectorB ?? "";
      const optionalVec = method === "lu";
      if (!optionalVec || vecRaw.trim() !== "") {
        const vec = parseVector(vecRaw);
        if (!optionalVec) {
          if (!vec) {
            errors.vectorB = "Vector b inválido o vacío";
          } else if (vec.length !== m.length) {
            errors.vectorB = `El vector debe tener ${m.length} componentes (igual que filas de A)`;
          }
        } else if (vecRaw.trim() && !vec) {
          errors.vectorB = "Vector b inválido";
        } else if (vec && vec.length !== m.length) {
          errors.vectorB = `El vector debe tener ${m.length} componentes o estar vacío`;
        }
      }
      continue;
    }

    if (param.type === "number") {
      if (param.name === "tolerance") {
        const e = validatePositiveFinite(v, label);
        if (e) errors[param.name] = e;
      } else if (param.name === "maxIter") {
        const e = validatePositiveInt(v, label);
        if (e) errors[param.name] = e;
      } else {
        const e = validateFiniteNumber(v, label);
        if (e) errors[param.name] = e;
      }
      continue;
    }

    if (param.name === "lu_variant") {
      const t = v
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (t === "") continue;
      const isDool = /dool/.test(t);
      const isCrout = /(crout|croot|krout)/.test(t);
      if (!isDool && !isCrout) errors.lu_variant = "Indique doolittle o crout";
      continue;
    }

    if (param.name === "x_values_str" || param.name === "y_values_str") {
      const list = parseCommaNumbers(v);
      if (!list || list.length < 2) {
        errors[param.name] = `${label}: al menos dos números separados por coma`;
      }
      continue;
    }
  }

  if (
    ["lagrange", "newton-divided", "cubic-spline"].includes(method) &&
    !errors.x_values_str &&
    !errors.y_values_str
  ) {
    const xs = parseCommaNumbers(values.x_values_str ?? "");
    const ys = parseCommaNumbers(values.y_values_str ?? "");
    if (xs && ys && xs.length !== ys.length) {
      errors.y_values_str = "Debe haber la misma cantidad de valores x e y";
    }
  }

  if (method === "bisection" && !errors.a && !errors.b) {
    const a = Number((values.a ?? "").trim().replace(",", "."));
    const b = Number((values.b ?? "").trim().replace(",", "."));
    if (Number.isFinite(a) && Number.isFinite(b) && a >= b) {
      errors.b = "El límite superior b debe ser mayor que a";
    }
  }

  const valid = Object.keys(errors).length === 0;
  return { valid, errors };
}
