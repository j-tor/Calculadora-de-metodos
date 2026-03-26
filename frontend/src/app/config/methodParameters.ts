export type ParamDef = {
  name: string;
  label: string;
  type: string;
  placeholder: string;
};

export const methodParameters: Record<string, ParamDef[]> = {
  newton: [
    { name: "x0", label: "Valor Inicial (x0)", type: "number", placeholder: "ej. 2.718 o 1" },
    { name: "tolerance", label: "Tolerancia (eps)", type: "number", placeholder: "ej. 1e-4" },
    { name: "maxIter", label: "Iteraciones Maximas", type: "number", placeholder: "ej. 100" },
  ],
  bisection: [
    { name: "a", label: "Limite Inferior (a)", type: "number", placeholder: "ej. 0" },
    { name: "b", label: "Limite Superior (b)", type: "number", placeholder: "ej. 2" },
    { name: "tolerance", label: "Tolerancia (eps)", type: "number", placeholder: "ej. 1e-4" },
    { name: "maxIter", label: "Iteraciones Maximas", type: "number", placeholder: "ej. 100" },
  ],
  "fixed-point": [
    { name: "x0", label: "Valor Inicial (x0)", type: "number", placeholder: "ej. 1 o 2.718" },
    { name: "tolerance", label: "Tolerancia (eps)", type: "number", placeholder: "ej. 1e-4" },
    { name: "maxIter", label: "Iteraciones Maximas", type: "number", placeholder: "ej. 100" },
  ],
  jacobi: [
    { name: "matrixA", label: "Matriz A (fila;fila)", type: "text", placeholder: "4,1,2;1,3,1;2,1,3" },
    { name: "vectorB", label: "Vector b", type: "text", placeholder: "4,5,6" },
    { name: "tolerance", label: "Tolerancia (eps)", type: "number", placeholder: "ej. 1e-4" },
    { name: "maxIter", label: "Iteraciones Maximas", type: "number", placeholder: "ej. 100" },
  ],
  "gauss-seidel": [
    { name: "matrixA", label: "Matriz A (fila;fila)", type: "text", placeholder: "4,1,2;1,3,1;2,1,3" },
    { name: "vectorB", label: "Vector b", type: "text", placeholder: "4,5,6" },
    { name: "tolerance", label: "Tolerancia (eps)", type: "number", placeholder: "ej. 1e-4" },
    { name: "maxIter", label: "Iteraciones Maximas", type: "number", placeholder: "ej. 100" },
  ],
  lu: [
    { name: "lu_variant", label: "Variante de LU", type: "text", placeholder: "ej. doolittle (o crout)" },
    { name: "matrixA", label: "Matriz A (fila;fila)", type: "text", placeholder: "4,1,2;1,3,1;2,1,3" },
    { name: "vectorB", label: "Vector b (Opcional)", type: "text", placeholder: "4,5,6" },
  ],
  lagrange: [
    { name: "x_values_str", label: "Valores x (separados por coma)", type: "text", placeholder: "ej. 0, 1, 2, 2.718" },
    { name: "y_values_str", label: "Valores y (separados por coma)", type: "text", placeholder: "ej. 0.5, 1, 2.718, 3" },
    { name: "x_eval", label: "Valor a Evaluar (x)", type: "number", placeholder: "ej. 1.5" },
  ],
  "newton-divided": [
    { name: "x_values_str", label: "Valores x (separados por coma)", type: "text", placeholder: "ej. 0, 1, 2, 2.718" },
    { name: "y_values_str", label: "Valores y (separados por coma)", type: "text", placeholder: "ej. 0.5, 1, 2.718, 3" },
    { name: "x_eval", label: "Valor a Evaluar (x)", type: "number", placeholder: "ej. 1.5" },
  ],
  "cubic-spline": [
    { name: "x_values_str", label: "Valores x (separados por coma)", type: "text", placeholder: "ej. 0, 1, 2, 2.718" },
    { name: "y_values_str", label: "Valores y (separados por coma)", type: "text", placeholder: "ej. 0.5, 1, 2.718, 3" },
    { name: "x_eval", label: "Valor a Evaluar (x)", type: "number", placeholder: "ej. 1.5" },
  ],
  euler: [
    { name: "x0", label: "Valor inicial x₀", type: "number", placeholder: "ej. 0" },
    { name: "y0", label: "Condición inicial y(x₀)", type: "number", placeholder: "ej. 1" },
    { name: "h", label: "Tamaño de paso (h)", type: "number", placeholder: "ej. 0.1" },
    { name: "x_end", label: "Valor final x_end", type: "number", placeholder: "ej. 2" },
  ],
  verlet: [
    { name: "x0", label: "Tiempo inicial x₀", type: "number", placeholder: "ej. 0" },
    { name: "y0", label: "Posición inicial y₀", type: "number", placeholder: "ej. 1" },
    { name: "v0", label: "Velocidad inicial v₀", type: "number", placeholder: "ej. 0" },
    { name: "h", label: "Tamaño de paso (h)", type: "number", placeholder: "ej. 0.1" },
    { name: "x_end", label: "Tiempo final x_end", type: "number", placeholder: "ej. 5" },
  ],
  rk4: [
    { name: "x0", label: "Valor inicial x₀", type: "number", placeholder: "ej. 0" },
    { name: "y0", label: "Condición inicial y(x₀)", type: "number", placeholder: "ej. 1" },
    { name: "h", label: "Tamaño de paso (h)", type: "number", placeholder: "ej. 0.1" },
    { name: "x_end", label: "Valor final x_end", type: "number", placeholder: "ej. 2" },
  ],
};
