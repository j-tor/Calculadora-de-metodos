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
## Jacobiano (simbolico y numerico)
{
  "funcs": ["x**2 + y", "x - y**2"],
  "vars_list": ["x","y"],
  "values": [1,2],
  "method": "jacobiano"
}
