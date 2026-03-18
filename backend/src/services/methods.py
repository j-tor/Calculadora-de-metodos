import numpy as np
import sympy as sp
from typing import Tuple, Callable, Sequence, List

def _validate_uniform_steps(x0: float, x_end: float, h: float) -> int:
    if h == 0:
        raise ValueError("El tamaÃ±o de paso h no puede ser 0.")
    steps_float = (x_end - x0) / h
    steps_rounded = int(round(steps_float))
    if abs(steps_float - steps_rounded) > 1e-10:
        raise ValueError("El intervalo no es mÃºltiplo exacto del paso h.")
    if steps_rounded < 0:
        raise ValueError("El paso h debe avanzar hacia x_end.")
    return steps_rounded

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
    history = []
    
    for _ in range(max_iter):
        iterations += 1
        fx = f(x_n)
        dfx = f_prime(x_n)
        
        history.append({"x": float(x_n), "y": float(fx), "iteration": iterations})
        
        if abs(dfx) < 1e-12:
            raise ValueError("Derivada cercana a cero. El método de Newton-Raphson falló.")
            
        x_next = x_n - fx / dfx
        
        if abs(x_next - x_n) < tol:
            return float(x_next), iterations, history
        
        x_n = x_next
        
    return float(x_n), iterations, history

def fixed_point_method(g_expr: sp.Expr, x_sym: sp.Symbol, x0: float, tol: float, max_iter: int) -> Tuple[float, int, list]:
    g = sp.lambdify(x_sym, g_expr, "numpy")
    x_n = x0
    iterations = 0
    history = []
    for _ in range(max_iter):
        iterations += 1
        x_next = g(x_n)
        history.append({"x": float(x_n), "y": float(x_next), "iteration": iterations})
        if abs(x_next - x_n) < tol:
            return float(x_next), iterations, history
        x_n = x_next
    return float(x_n), iterations, history

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

def trapezoidal_rule(f: Callable, a: float, b: float, n: int) -> float:
    if n is None or n <= 0:
        raise ValueError("n debe ser un entero positivo.")
    h = (b - a) / n
    xs = np.linspace(a, b, n + 1)
    ys = f(xs)
    return float(h * (0.5 * ys[0] + np.sum(ys[1:-1]) + 0.5 * ys[-1]))

def simpson_one_third_rule(f: Callable, a: float, b: float, n: int) -> float:
    if n is None or n <= 0:
        raise ValueError("n debe ser un entero positivo.")
    if n % 2 != 0:
        raise ValueError("Simpson 1/3 requiere n par.")
    h = (b - a) / n
    xs = np.linspace(a, b, n + 1)
    ys = f(xs)
    return float((h / 3) * (ys[0] + ys[-1] + 4 * np.sum(ys[1:-1:2]) + 2 * np.sum(ys[2:-1:2])))

def simpson_three_eighths_rule(f: Callable, a: float, b: float, n: int) -> float:
    if n is None or n <= 0:
        raise ValueError("n debe ser un entero positivo.")
    if n % 3 != 0:
        raise ValueError("Simpson 3/8 requiere n mÃºltiplo de 3.")
    h = (b - a) / n
    xs = np.linspace(a, b, n + 1)
    ys = f(xs)
    indices = np.arange(1, n)
    sum_three = np.sum(ys[indices[indices % 3 != 0]])
    sum_two = np.sum(ys[indices[indices % 3 == 0]])
    return float((3 * h / 8) * (ys[0] + ys[-1] + 3 * sum_three + 2 * sum_two))

def jacobi_method(
    A: Sequence[Sequence[float]],
    b: Sequence[float],
    x0: Sequence[float] = None,
    tol: float = 1e-6,
    max_iter: int = 100,
) -> Tuple[np.ndarray, int, bool]:
    A = np.array(A, dtype=float)
    b = np.array(b, dtype=float)
    n = A.shape[0]
    if A.shape[0] != A.shape[1]:
        raise ValueError("La matriz A debe ser cuadrada.")
    if b.shape[0] != n:
        raise ValueError("El vector b debe tener el mismo tamaÃ±o que A.")
    if np.any(np.abs(np.diag(A)) < 1e-12):
        raise ValueError("Cero en la diagonal.")
    x = np.zeros(n) if x0 is None else np.array(x0, dtype=float)
    D = np.diag(A)
    R = A - np.diagflat(D)
    for k in range(max_iter):
        x_new = (b - np.dot(R, x)) / D
        if np.linalg.norm(x_new - x, ord=np.inf) < tol:
            return x_new, k + 1, True
        x = x_new
    return x, max_iter, False

def gauss_seidel_method(
    A: Sequence[Sequence[float]],
    b: Sequence[float],
    x0: Sequence[float] = None,
    tol: float = 1e-6,
    max_iter: int = 100,
) -> Tuple[np.ndarray, int, bool]:
    A = np.array(A, dtype=float)
    b = np.array(b, dtype=float)
    n = A.shape[0]
    if A.shape[0] != A.shape[1]:
        raise ValueError("La matriz A debe ser cuadrada.")
    if b.shape[0] != n:
        raise ValueError("El vector b debe tener el mismo tamaÃ±o que A.")
    if np.any(np.abs(np.diag(A)) < 1e-12):
        raise ValueError("Cero en la diagonal.")
    x = np.zeros(n) if x0 is None else np.array(x0, dtype=float)
    for k in range(max_iter):
        x_old = x.copy()
        for i in range(n):
            s1 = np.dot(A[i, :i], x[:i])
            s2 = np.dot(A[i, i + 1:], x_old[i + 1:])
            x[i] = (b[i] - s1 - s2) / A[i, i]
        if np.linalg.norm(x - x_old, ord=np.inf) < tol:
            return x, k + 1, True
    return x, max_iter, False

def euler_method(
    f_expr: sp.Expr,
    x_sym: sp.Symbol,
    y_sym: sp.Symbol,
    x0: float,
    y0: float,
    h: float,
    x_end: float,
) -> Tuple[np.ndarray, np.ndarray]:
    steps = _validate_uniform_steps(x0, x_end, h)
    f = sp.lambdify((x_sym, y_sym), f_expr, "numpy")
    xs = [x0]
    ys = [y0]
    for _ in range(steps):
        x_n = xs[-1]
        y_n = ys[-1]
        y_next = y_n + h * f(x_n, y_n)
        xs.append(x_n + h)
        ys.append(y_next)
    return np.array(xs, dtype=float), np.array(ys, dtype=float)

def rk2_method(
    f_expr: sp.Expr,
    x_sym: sp.Symbol,
    y_sym: sp.Symbol,
    x0: float,
    y0: float,
    h: float,
    x_end: float,
) -> Tuple[np.ndarray, np.ndarray]:
    steps = _validate_uniform_steps(x0, x_end, h)
    f = sp.lambdify((x_sym, y_sym), f_expr, "numpy")
    xs = [x0]
    ys = [y0]
    for _ in range(steps):
        x_n = xs[-1]
        y_n = ys[-1]
        k1 = f(x_n, y_n)
        k2 = f(x_n + h, y_n + h * k1)
        y_next = y_n + (h / 2) * (k1 + k2)
        xs.append(x_n + h)
        ys.append(y_next)
    return np.array(xs, dtype=float), np.array(ys, dtype=float)

def rk4_method(
    f_expr: sp.Expr,
    x_sym: sp.Symbol,
    y_sym: sp.Symbol,
    x0: float,
    y0: float,
    h: float,
    x_end: float,
) -> Tuple[np.ndarray, np.ndarray]:
    steps = _validate_uniform_steps(x0, x_end, h)
    f = sp.lambdify((x_sym, y_sym), f_expr, "numpy")
    xs = [x0]
    ys = [y0]
    for _ in range(steps):
        x_n = xs[-1]
        y_n = ys[-1]
        k1 = f(x_n, y_n)
        k2 = f(x_n + h / 2, y_n + h * k1 / 2)
        k3 = f(x_n + h / 2, y_n + h * k2 / 2)
        k4 = f(x_n + h, y_n + h * k3)
        y_next = y_n + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
        xs.append(x_n + h)
        ys.append(y_next)
    return np.array(xs, dtype=float), np.array(ys, dtype=float)

def verlet_method(
    g_expr: sp.Expr,
    x_sym: sp.Symbol,
    y_sym: sp.Symbol,
    x0: float,
    y0: float,
    v0: float,
    h: float,
    x_end: float,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    steps = _validate_uniform_steps(x0, x_end, h)
    g = sp.lambdify((x_sym, y_sym), g_expr, "numpy")
    xs = [x0]
    ys = [y0]
    vs = [v0]
    a = g(x0, y0)
    for _ in range(steps):
        x_n = xs[-1]
        y_n = ys[-1]
        v_n = vs[-1]
        y_next = y_n + v_n * h + 0.5 * a * h * h
        x_next = x_n + h
        a_next = g(x_next, y_next)
        v_next = v_n + 0.5 * (a + a_next) * h
        xs.append(x_next)
        ys.append(y_next)
        vs.append(v_next)
        a = a_next
    return np.array(xs, dtype=float), np.array(ys, dtype=float), np.array(vs, dtype=float)

def verlet_error_estimate(
    g_expr: sp.Expr,
    x_sym: sp.Symbol,
    y_sym: sp.Symbol,
    x0: float,
    y0: float,
    v0: float,
    h: float,
    x_end: float,
) -> float:
    xs_h, ys_h, _ = verlet_method(g_expr, x_sym, y_sym, x0, y0, v0, h, x_end)
    xs_h2, ys_h2, _ = verlet_method(g_expr, x_sym, y_sym, x0, y0, v0, h / 2, x_end)
    return float(abs(ys_h2[-1] - ys_h[-1]))
