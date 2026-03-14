import numpy as np
import sympy as sp
from typing import Tuple, Callable

def bisection_method(f: Callable, a: float, b: float, tol: float, max_iter: int) -> Tuple[float, int]:
    if f(a) * f(b) >= 0:
        raise ValueError("El intervalo no cambia de signo (f(a)*f(b) >= 0).")
    
    iterations = 0
    c = a
    while (b - a) / 2 > tol and iterations < max_iter:
        iterations += 1
        c = (a + b) / 2
        if f(c) == 0:
            break
        if f(a) * f(c) < 0:
            b = c
        else:
            a = c
    return float(c), iterations

def newton_raphson_method(f_expr: sp.Expr, x_sym: sp.Symbol, x0: float, tol: float, max_iter: int) -> Tuple[float, int]:
    f_prime_expr = sp.diff(f_expr, x_sym)
    
    # Lambdify for fast evaluation
    f = sp.lambdify(x_sym, f_expr, "numpy")
    f_prime = sp.lambdify(x_sym, f_prime_expr, "numpy")
    
    x_n = x0
    iterations = 0
    
    for _ in range(max_iter):
        iterations += 1
        fx = f(x_n)
        dfx = f_prime(x_n)
        
        if abs(dfx) < 1e-12:
            raise ValueError("Derivada cercana a cero. El método de Newton-Raphson falló.")
            
        x_next = x_n - fx / dfx
        
        if abs(x_next - x_n) < tol:
            return float(x_next), iterations
        
        x_n = x_next
        
    return float(x_n), iterations
