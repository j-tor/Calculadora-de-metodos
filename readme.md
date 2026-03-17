# Llamada de funciones (segun frontend)

## Metodo de Newton-Raphson
{
  "equation": "cos(x) - x",
  "x0": 0.5,
  "tolerance": 1e-6,
  "maxIter": 100,
  "method": "newton"
}

## Metodo de Biseccion
{
  "equation": "x**2 - 4",
  "a": 0,
  "b": 3,
  "tolerance": 1e-6,
  "maxIter": 100,
  "method": "bisection"
}

## Punto Fijo
{
  "equation": "cos(x)",
  "x0": 0.5,
  "tolerance": 1e-6,
  "maxIter": 100,
  "method": "fixed-point"
}

## Jacobi
{
  "matrixA": "4,1,2;1,3,1;2,1,3",
  "vectorB": "4,5,6",
  "tolerance": 1e-6,
  "maxIter": 100,
  "method": "jacobi"
}

## Gauss-Seidel
{
  "matrixA": "4,1,2;1,3,1;2,1,3",
  "vectorB": "4,5,6",
  "tolerance": 1e-6,
  "maxIter": 100,
  "method": "gauss-seidel"
}

## Descomposicion LU
{
  "matrixA": "2,1;4,5",
  "vectorB": "5,6",
  "lu_variant": "doolittle",
  "method": "lu"
}

## Regla del Trapecio
{
  "equation": "sin(x)",
  "a": 0,
  "b": 3.1416,
  "n": 12,
  "method": "trapezoidal"
}

## Simpson 1/3
{
  "equation": "sin(x)",
  "a": 0,
  "b": 3.1416,
  "n": 12,
  "method": "simpson-1-3"
}

## Simpson 3/8
{
  "equation": "sin(x)",
  "a": 0,
  "b": 3.1416,
  "n": 12,
  "method": "simpson-3-8"
}

## Metodo de Euler (ODE y' = f(x,y))
{
  "equation": "x + y",
  "x0": 0,
  "xf": 1,
  "y0": 1,
  "h": 0.1,
  "method": "euler"
}

## Orden del Metodo de Euler
{
  "method": "euler-order"
}

## Metodo de Verlet (ODE y'' = g(x,y))
{
  "equation": "-x",
  "x0": 0,
  "xf": 2,
  "y0": 1,
  "v0": 0,
  "h": 0.1,
  "method": "verlet"
}

## Error del Metodo de Verlet
{
  "equation": "-x",
  "x0": 0,
  "xf": 2,
  "y0": 1,
  "v0": 0,
  "h": 0.1,
  "method": "verlet-error"
}

## Runge-Kutta de segundo orden (RK2)
{
  "equation": "x + y",
  "x0": 0,
  "xf": 1,
  "y0": 1,
  "h": 0.1,
  "method": "rk2"
}

## Runge-Kutta de cuarto orden (RK4)
{
  "equation": "x + y",
  "x0": 0,
  "xf": 1,
  "y0": 1,
  "h": 0.1,
  "method": "rk4"
}

## Interpolacion de Lagrange
{
  "x_values": [0, 1, 2],
  "y_values": [1, 3, 2],
  "x_eval": 1.5,
  "method": "lagrange"
}

## Interpolacion de Newton
{
  "x_values": [0, 1, 2],
  "y_values": [1, 3, 2],
  "x_eval": 1.5,
  "method": "newton-divided"
}
