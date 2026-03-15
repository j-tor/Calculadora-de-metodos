import numpy as np
import sympy as sp
from typing import Tuple, Callable, Sequence, List

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

def fixed_point_method(g_expr: sp.Expr, x_sym: sp.Symbol, x0: float, tol: float, max_iter: int) -> Tuple[float, int]:
    g = sp.lambdify(x_sym, g_expr, "numpy")
    x_n = x0
    iterations = 0
    for _ in range(max_iter):
        iterations += 1
        x_next = g(x_n)
        if abs(x_next - x_n) < tol:
            return float(x_next), iterations
        x_n = x_next
    return float(x_n), iterations

def fixed_point_convergence(g_expr: sp.Expr, x_sym: sp.Symbol, x0: float = None, interval: Tuple[float, float] = None) -> bool:
    g_prime = sp.diff(g_expr, x_sym)
    g_prime_f = sp.lambdify(x_sym, g_prime, "numpy")
    if interval is not None:
        a, b = interval
        xs = np.linspace(a, b, 200)
        vals = np.abs(g_prime_f(xs))
        return bool(np.nanmax(vals) < 1.0)
    if x0 is None:
        raise ValueError("x0 requerido si no se da intervalo.")
    return abs(float(g_prime_f(x0))) < 1.0

def lagrange_interpolation(x_vals: Sequence[float], y_vals: Sequence[float], x: float) -> float:
    if len(x_vals) != len(y_vals):
        raise ValueError("x_vals y y_vals deben tener la misma longitud.")
    n = len(x_vals)
    total = 0.0
    for i in range(n):
        term = y_vals[i]
        for j in range(n):
            if i != j:
                denom = x_vals[i] - x_vals[j]
                if denom == 0:
                    raise ValueError("Valores x repetidos.")
                term *= (x - x_vals[j]) / denom
        total += term
    return float(total)

def lagrange_polynomial(x_vals: Sequence[float], y_vals: Sequence[float]) -> sp.Expr:
    x = sp.symbols("x")
    if len(x_vals) != len(y_vals):
        raise ValueError("x_vals y y_vals deben tener la misma longitud.")
    n = len(x_vals)
    poly = 0
    for i in range(n):
        term = y_vals[i]
        for j in range(n):
            if i != j:
                denom = x_vals[i] - x_vals[j]
                if denom == 0:
                    raise ValueError("Valores x repetidos.")
                term *= (x - x_vals[j]) / denom
        poly += term
    return sp.simplify(poly)

def polynomial_interpolation_coeffs(x_vals: Sequence[float], y_vals: Sequence[float]) -> np.ndarray:
    if len(x_vals) != len(y_vals):
        raise ValueError("x_vals y y_vals deben tener la misma longitud.")
    n = len(x_vals)
    vander = np.vander(np.array(x_vals, dtype=float), N=n, increasing=False)
    coeffs = np.linalg.solve(vander, np.array(y_vals, dtype=float))
    return coeffs

def polynomial_interpolation_eval(coeffs: Sequence[float], x: float) -> float:
    return float(np.polyval(np.array(coeffs, dtype=float), x))

def newton_divided_differences(x_vals: Sequence[float], y_vals: Sequence[float]) -> np.ndarray:
    if len(x_vals) != len(y_vals):
        raise ValueError("x_vals y y_vals deben tener la misma longitud.")
    n = len(x_vals)
    coef = np.array(y_vals, dtype=float).copy()
    x_vals = np.array(x_vals, dtype=float)
    for j in range(1, n):
        coef[j:n] = (coef[j:n] - coef[j - 1:n - 1]) / (x_vals[j:n] - x_vals[0:n - j])
    return coef

def newton_interpolation_eval(x_vals: Sequence[float], coef: Sequence[float], x: float) -> float:
    n = len(coef)
    result = coef[n - 1]
    for k in range(n - 2, -1, -1):
        result = result * (x - x_vals[k]) + coef[k]
    return float(result)

def cubic_spline_coeffs(x_vals: Sequence[float], y_vals: Sequence[float]) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    if len(x_vals) != len(y_vals):
        raise ValueError("x_vals y y_vals deben tener la misma longitud.")
    n = len(x_vals)
    if n < 2:
        raise ValueError("Se requieren al menos dos puntos.")
    x = np.array(x_vals, dtype=float)
    y = np.array(y_vals, dtype=float)
    h = np.diff(x)
    if np.any(h == 0):
        raise ValueError("Valores x repetidos.")
    alpha = np.zeros(n)
    for i in range(1, n - 1):
        alpha[i] = (3 / h[i]) * (y[i + 1] - y[i]) - (3 / h[i - 1]) * (y[i] - y[i - 1])

    l = np.ones(n)
    mu = np.zeros(n)
    z = np.zeros(n)
    for i in range(1, n - 1):
        l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1]
        mu[i] = h[i] / l[i]
        z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i]

    c = np.zeros(n)
    b = np.zeros(n - 1)
    d = np.zeros(n - 1)
    a = y[:-1].copy()
    for j in range(n - 2, -1, -1):
        c[j] = z[j] - mu[j] * c[j + 1]
        b[j] = (y[j + 1] - y[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3
        d[j] = (c[j + 1] - c[j]) / (3 * h[j])
    return a, b, c[:-1], d

def cubic_spline_eval(x_vals: Sequence[float], coeffs: Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray], x: float) -> float:
    a, b, c, d = coeffs
    xs = np.array(x_vals, dtype=float)
    if x < xs[0] or x > xs[-1]:
        raise ValueError("x fuera del rango de interpolacion.")
    i = np.searchsorted(xs, x) - 1
    i = max(0, min(i, len(a) - 1))
    dx = x - xs[i]
    return float(a[i] + b[i] * dx + c[i] * dx**2 + d[i] * dx**3)

def solve_upper_triangular(U: Sequence[Sequence[float]], b: Sequence[float]) -> np.ndarray:
    U = np.array(U, dtype=float)
    b = np.array(b, dtype=float)
    n = U.shape[0]
    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        if abs(U[i, i]) < 1e-12:
            raise ValueError("Cero en la diagonal.")
        x[i] = (b[i] - np.dot(U[i, i + 1:], x[i + 1:])) / U[i, i]
    return x

def solve_lower_triangular(L: Sequence[Sequence[float]], b: Sequence[float]) -> np.ndarray:
    L = np.array(L, dtype=float)
    b = np.array(b, dtype=float)
    n = L.shape[0]
    x = np.zeros(n)
    for i in range(n):
        if abs(L[i, i]) < 1e-12:
            raise ValueError("Cero en la diagonal.")
        x[i] = (b[i] - np.dot(L[i, :i], x[:i])) / L[i, i]
    return x

def solve_diagonal(D: Sequence[Sequence[float]], b: Sequence[float]) -> np.ndarray:
    D = np.array(D, dtype=float)
    b = np.array(b, dtype=float)
    diag = np.diag(D)
    if np.any(np.abs(diag) < 1e-12):
        raise ValueError("Cero en la diagonal.")
    return b / diag

def lu_doolittle(A: Sequence[Sequence[float]]) -> Tuple[np.ndarray, np.ndarray]:
    A = np.array(A, dtype=float)
    n = A.shape[0]
    L = np.zeros((n, n))
    U = np.zeros((n, n))
    for i in range(n):
        L[i, i] = 1.0
        for j in range(i, n):
            U[i, j] = A[i, j] - np.dot(L[i, :i], U[:i, j])
        for j in range(i + 1, n):
            if abs(U[i, i]) < 1e-12:
                raise ValueError("Cero en la diagonal de U.")
            L[j, i] = (A[j, i] - np.dot(L[j, :i], U[:i, i])) / U[i, i]
    return L, U

def lu_crout(A: Sequence[Sequence[float]]) -> Tuple[np.ndarray, np.ndarray]:
    A = np.array(A, dtype=float)
    n = A.shape[0]
    L = np.zeros((n, n))
    U = np.eye(n)
    for j in range(n):
        for i in range(j, n):
            L[i, j] = A[i, j] - np.dot(L[i, :j], U[:j, j])
        for i in range(j + 1, n):
            if abs(L[j, j]) < 1e-12:
                raise ValueError("Cero en la diagonal de L.")
            U[j, i] = (A[j, i] - np.dot(L[j, :j], U[:j, i])) / L[j, j]
    return L, U

def lu_solve(L: Sequence[Sequence[float]], U: Sequence[Sequence[float]], b: Sequence[float]) -> np.ndarray:
    y = solve_lower_triangular(L, b)
    x = solve_upper_triangular(U, y)
    return x

def jacobian_matrix(funcs: Sequence[sp.Expr], vars: Sequence[sp.Symbol]) -> sp.Matrix:
    return sp.Matrix(funcs).jacobian(sp.Matrix(vars))

def jacobian_evaluate(funcs: Sequence[sp.Expr], vars: Sequence[sp.Symbol], values: Sequence[float]) -> np.ndarray:
    J = jacobian_matrix(funcs, vars)
    subs = {var: val for var, val in zip(vars, values)}
    J_num = np.array(J.subs(subs), dtype=float)
    return J_num
