# Llamada de funciones

## Biseccion
{
  "equation": "x**2 - 4",
  "x_start": 0,
  "x_end": 3,
  "method": "biseccion"
}
##  Newton-Raphson
{
  "equation": "cos(x) - x",
  "initial_guess": 0.5,
  "method": "newton"
}
##  Punto fijo
{
  "equation": "cos(x)",
  "initial_guess": 0.5,
  "method": "punto fijo"
}
##  Convergencia fija
{
  "equation": "cos(x)",
  "x_start": 0,
  "x_end": 1,
  "method": "convergenciafija"
}
##  Interpolacion de Lagrange
{
  "x_values": [0, 1, 2],
  "y_values": [1, 3, 2],
  "x_eval": 1.5,
  "method": "lagrange"
}
##  Interpolacion polinomica (Vandermonde)
{
  "x_values": [0, 1, 2],
  "y_values": [1, 3, 2],
  "x_eval": 1.5,
  "method": "polinomica"
}
## Interpolacion de Newton (dif. divididas)
{
  "x_values": [0, 1, 2],
  "y_values": [1, 3, 2],
  "x_eval": 1.5,
  "method": "newton interpolacion"
}
##  Trazos cubicos (spline)
{
  "x_values": [0, 1, 2],
  "y_values": [1, 3, 2],
  "x_eval": 1.5,
  "method": "trazos cubicos"
}
##  Matriz triangular superior
{
  "matrix_a": [[2,1,0],[0,3,1],[0,0,4]],
  "vector_b": [3,7,8],
  "matrix_type": "upper",
  "method": "matriz"
}
##  Matriz triangular inferior
{
  "matrix_a": [[2,0,0],[1,3,0],[4,2,5]],
  "vector_b": [2,5,3],
  "matrix_type": "lower",
  "method": "matriz"
}
## Matriz diagonal
{
  "matrix_a": [[2,0,0],[0,3,0],[0,0,4]],
  "vector_b": [2,6,8],
  "matrix_type": "diagonal",
  "method": "matriz"
}
## LU Doolittle
{
  "matrix_a": [[2,1],[4,5]],
  "vector_b": [5,6],
  "lu_variant": "doolittle",
  "method": "lu"
}
## LU Crout
{
  "matrix_a": [[2,1],[4,5]],
  "vector_b": [5,6],
  "lu_variant": "crout",
  "method": "lu"
}
## Descomposicion LU (solo L y U)
{
  "matrix_a": [[2,1],[4,5]],
  "lu_variant": "doolittle",
  "method": "lu"
}
## Descomposicion LU (con solucion Ax=b)
{
  "matrix_a": [[2,1],[4,5]],
  "vector_b": [5,6],
  "lu_variant": "crout",
  "method": "lu"
}
## Jacobi
{
  "matrix_a": [[4,1,2],[1,3,1],[2,1,3]],
  "vector_b": [4,5,6],
  "tolerance": 1e-6,
  "max_iterations": 100,
  "method": "jacobi"
}
## Gauss-Seidel
{
  "matrix_a": [[4,1,2],[1,3,1],[2,1,3]],
  "vector_b": [4,5,6],
  "tolerance": 1e-6,
  "max_iterations": 100,
  "method": "gauss-seidel"
}
## Jacobiano (simbolico y numerico)
{
  "funcs": ["x**2 + y", "x - y**2"],
  "vars_list": ["x","y"],
  "values": [1,2],
  "method": "jacobiano"
}
## Regla del Trapecio
{
  "equation": "sin(x)",
  "x_start": 0,
  "x_end": 3.1416,
  "n_subintervals": 12,
  "method": "trapecio"
}
## Simpson 1/3
{
  "equation": "sin(x)",
  "x_start": 0,
  "x_end": 3.1416,
  "n_subintervals": 12,
  "method": "simpson 1/3"
}
## Simpson 3/8
{
  "equation": "sin(x)",
  "x_start": 0,
  "x_end": 3.1416,
  "n_subintervals": 12,
  "method": "simpson 3/8"
}
## Metodo de Euler (ODE y' = f(x,y))
{
  "equation": "x + y",
  "x0": 0,
  "x_end": 1,
  "y0": 1,
  "h": 0.1,
  "method": "euler"
}
## Orden del Metodo de Euler
{
  "method": "orden euler"
}
## Nota Orden del Metodo de Euler (respuesta)
{
  "method_used": "Orden del Metodo de Euler",
  "order": 1,
  "local_order": 2
}
## Metodo de Verlet (ODE y'' = g(x,y))
{
  "equation": "-x",
  "x0": 0,
  "x_end": 2,
  "y0": 1,
  "v0": 0,
  "h": 0.1,
  "method": "verlet"
}
## Error del Metodo de Verlet
{
  "equation": "-x",
  "x0": 0,
  "x_end": 2,
  "y0": 1,
  "v0": 0,
  "h": 0.1,
  "method": "error verlet"
}
## Runge-Kutta de segundo orden (RK2)
{
  "equation": "x + y",
  "x0": 0,
  "x_end": 1,
  "y0": 1,
  "h": 0.1,
  "method": "rk2"
}
## Runge-Kutta de cuarto orden (RK4)
{
  "equation": "x + y",
  "x0": 0,
  "x_end": 1,
  "y0": 1,
  "h": 0.1,
  "method": "rk4"
}
