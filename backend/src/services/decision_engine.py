import sympy as sp
from typing import Tuple, Dict, Any, Sequence
from .methods import (
    bisection_method,
    newton_raphson_method,
    fixed_point_method,
    fixed_point_convergence,
    lagrange_interpolation,
    lagrange_polynomial,
    polynomial_interpolation_coeffs,
    polynomial_interpolation_eval,
    newton_divided_differences,
    newton_interpolation_eval,
    cubic_spline_coeffs,
    cubic_spline_eval,
    solve_upper_triangular,
    solve_lower_triangular,
    solve_diagonal,
    lu_doolittle,
    lu_crout,
    lu_solve,
    trapezoidal_rule,
    simpson_one_third_rule,
    simpson_three_eighths_rule,
    jacobi_method,
    gauss_seidel_method,
    euler_method,
    rk2_method,
    rk4_method,
    verlet_method,
    verlet_error_estimate,
    jacobian_matrix,
    jacobian_evaluate,
)

def analyze_and_calculate(
    equation_str: str = None,
    var_name: str = "x",
    x_start: float = None,
    x_end: float = None,
    initial_guess: float = None,
    tol: float = 1e-6,
    max_iter: int = 100,
    requested_method: str = None, # NEW
    g_equation_str: str = None,
    x_values: Sequence[float] = None,
    y_values: Sequence[float] = None,
    x_eval: float = None,
    matrix_a: Sequence[Sequence[float]] = None,
    vector_b: Sequence[float] = None,
    matrix_type: str = None,
    lu_variant: str = None,
    funcs: Sequence[str] = None,
    vars_list: Sequence[str] = None,
    values: Sequence[float] = None,
    n_subintervals: int = None,
    y0: float = None,
    v0: float = None,
    h: float = None,
    x0: float = None,
) -> Dict[str, Any]:
    x = sp.symbols(var_name)
    y = sp.symbols("y")

    def _parse_expr(expr_str: str) -> sp.Expr:
        try:
            return sp.parse_expr(expr_str)
        except Exception as e:
            raise ValueError(f"Error al interpretar la ecuación: {str(e)}")

    # 1. Manual selection bypass
    if requested_method:
        requested_method = requested_method.lower()
        if "bisec" in requested_method:
            if equation_str is None:
                raise ValueError("Escribe una ecuación f(x) en el editor matemático para usar Bisección. Ejemplo: x**2 - 4")
            expr = _parse_expr(equation_str)
            f_lamb = sp.lambdify(x, expr, "numpy")
            if x_start is None or x_end is None:
                raise ValueError("El método de Bisección requiere los límites del intervalo: llena los campos 'a' (inferior) y 'b' (superior).")
            res, iters = bisection_method(f_lamb, x_start, x_end, tol, max_iter)
            return {"method": "Bisección", "result": res, "iterations": iters, "expression": expr, "symbol": x}
        
        elif "newton" in requested_method and "interpol" not in requested_method:
            if equation_str is None:
                raise ValueError("Escribe una ecuación f(x) en el editor matemático para usar Newton-Raphson. Ejemplo: x**3 - 2*x - 5")
            expr = _parse_expr(equation_str)
            start_point = initial_guess if initial_guess is not None else (x_start + x_end) / 2 if (x_start is not None and x_end is not None) else 0.0
            res, iters = newton_raphson_method(expr, x, start_point, tol, max_iter)
            return {"method": "Newton-Raphson", "result": res, "iterations": iters, "expression": expr, "symbol": x}

        elif "punto fijo" in requested_method or "fixed" in requested_method:
            expr_str = g_equation_str if g_equation_str is not None else equation_str
            if expr_str is None:
                raise ValueError("Escribe la función de iteración g(x) en el editor matemático para Punto Fijo. Ejemplo: (x + 2/x) / 2")
            g_expr = _parse_expr(expr_str)
            start_point = initial_guess if initial_guess is not None else (x_start + x_end) / 2 if (x_start is not None and x_end is not None) else 0.0
            res, iters = fixed_point_method(g_expr, x, start_point, tol, max_iter)
            return {"method": "Punto Fijo", "result": res, "iterations": iters, "expression": g_expr, "symbol": x}

        elif "convergenciafija" in requested_method or "convergencia fija" in requested_method or "convergence" in requested_method:
            expr_str = g_equation_str if g_equation_str is not None else equation_str
            if expr_str is None:
                raise ValueError("Escribe la función g(x) en el editor matemático para verificar la convergencia.")
            g_expr = _parse_expr(expr_str)
            interval = (x_start, x_end) if (x_start is not None and x_end is not None) else None
            converges = fixed_point_convergence(g_expr, x, x0=initial_guess, interval=interval)
            return {"method": "Convergencia Fija", "converges": converges, "expression": g_expr, "symbol": x}

        elif "lagrange" in requested_method:
            if x_values is None or y_values is None:
                raise ValueError("Ingresa los puntos conocidos: llena los campos 'Valores de X' y 'Valores de Y' separados por comas (ej: 1,2,3 y 4,5,6).")
            value = None
            if x_eval is not None:
                value = lagrange_interpolation(x_values, y_values, x_eval)
            poly = lagrange_polynomial(x_values, y_values)
            return {"method": "Lagrange", "value": value, "polynomial": poly, "x_eval": x_eval}

        elif "polinomica" in requested_method or "polynomial" in requested_method:
            if x_values is None or y_values is None:
                raise ValueError("Ingresa los puntos conocidos: llena los campos 'Valores de X' y 'Valores de Y' separados por comas.")
            coeffs = polynomial_interpolation_coeffs(x_values, y_values)
            value = None
            if x_eval is not None:
                value = polynomial_interpolation_eval(coeffs, x_eval)
            return {"method": "Interpolación Polinómica", "coefficients": coeffs, "value": value, "x_eval": x_eval}

        elif "newton-divided" in requested_method or ("newton" in requested_method and "interpol" in requested_method):
            if x_values is None or y_values is None:
                raise ValueError("Ingresa los puntos conocidos: llena los campos 'Valores de X' y 'Valores de Y' separados por comas.")
            coef = newton_divided_differences(x_values, y_values)
            value = None
            if x_eval is not None:
                value = newton_interpolation_eval(x_values, coef, x_eval)
            return {"method": "Interpolación de Newton", "coefficients": coef, "value": value, "x_eval": x_eval}

        elif "trazos" in requested_method or "spline" in requested_method or "cubicos" in requested_method:
            if x_values is None or y_values is None:
                raise ValueError("Ingresa los puntos conocidos: llena los campos 'Valores de X' y 'Valores de Y' separados por comas.")
            coeffs = cubic_spline_coeffs(x_values, y_values)
            value = None
            if x_eval is not None:
                value = cubic_spline_eval(x_values, coeffs, x_eval)
            return {"method": "Trazos Cúbicos", "coefficients": coeffs, "value": value, "x_eval": x_eval}

        elif "matriz" in requested_method or "triangular" in requested_method or "diagonal" in requested_method:
            if matrix_a is None or vector_b is None:
                raise ValueError("Ingresa la Matriz A y el Vector b. Usa ';' para separar filas y ',' para columnas (ej: Matriz: 1,2;3,4 | Vector: 5,6).")
            mtype = matrix_type
            if mtype is None:
                if "superior" in requested_method or "upper" in requested_method:
                    mtype = "upper"
                elif "inferior" in requested_method or "lower" in requested_method:
                    mtype = "lower"
                elif "diagonal" in requested_method:
                    mtype = "diagonal"
            if mtype == "upper":
                sol = solve_upper_triangular(matrix_a, vector_b)
                return {"method": "Triangular Superior", "solution": sol}
            if mtype == "lower":
                sol = solve_lower_triangular(matrix_a, vector_b)
                return {"method": "Triangular Inferior", "solution": sol}
            if mtype == "diagonal":
                sol = solve_diagonal(matrix_a, vector_b)
                return {"method": "Diagonal", "solution": sol}
            raise ValueError("Selecciona el tipo de matriz: 'upper' (triangular superior), 'lower' (triangular inferior) o 'diagonal'.")

        elif "lu" in requested_method or "doolittle" in requested_method or "crout" in requested_method or "kourt" in requested_method:
            if matrix_a is None:
                raise ValueError("Ingresa la Matriz A para la descomposición LU. Usa ';' para separar filas y ',' para columnas.")
            variant = lu_variant
            if variant is None:
                if "doolittle" in requested_method:
                    variant = "doolittle"
                elif "crout" in requested_method or "kourt" in requested_method:
                    variant = "crout"
            if variant == "doolittle":
                L, U = lu_doolittle(matrix_a)
            elif variant == "crout":
                L, U = lu_crout(matrix_a)
            else:
                raise ValueError("Selecciona la variante de LU: 'doolittle' o 'crout'.")
            sol = None
            if vector_b is not None:
                sol = lu_solve(L, U, vector_b)
            return {"method": f"LU ({variant})", "L": L, "U": U, "solution": sol}

        elif "jacobiano" in requested_method or "jacobian" in requested_method:
            if funcs is None or vars_list is None:
                raise ValueError("Ingresa las funciones y las variables para calcular el Jacobiano.")
            vars_syms = [sp.symbols(v) for v in vars_list]
            funcs_expr = [_parse_expr(f) for f in funcs]
            J = jacobian_matrix(funcs_expr, vars_syms)
            J_num = None
            if values is not None:
                J_num = jacobian_evaluate(funcs_expr, vars_syms, values)
            return {"method": "Jacobiano", "jacobian": J, "jacobian_numeric": J_num}

        elif "trapec" in requested_method or "trapez" in requested_method:
            if equation_str is None:
                raise ValueError("Escribe f(x) en el editor matemático para la Regla del Trapecio. Ejemplo: x**2")
            if x_start is None or x_end is None:
                raise ValueError("Llena los campos 'a' (límite inferior) y 'b' (límite superior) del intervalo.")
            if n_subintervals is None:
                raise ValueError("Ingresa el número de subintervalos (n) para la Regla del Trapecio.")
            expr = _parse_expr(equation_str)
            f = sp.lambdify(x, expr, "numpy")
            result = trapezoidal_rule(f, x_start, x_end, n_subintervals)
            return {"method": "Regla del Trapecio", "result": result}

        elif "simpson" in requested_method and ("3/8" in requested_method or "3-8" in requested_method or "3 8" in requested_method):
            if equation_str is None:
                raise ValueError("Escribe f(x) en el editor matemático para Simpson 3/8. Ejemplo: sin(x)")
            if x_start is None or x_end is None:
                raise ValueError("Llena los campos 'a' y 'b' del intervalo para Simpson 3/8.")
            if n_subintervals is None:
                raise ValueError("Ingresa el número de subintervalos (n) para Simpson 3/8. Debe ser múltiplo de 3.")
            expr = _parse_expr(equation_str)
            f = sp.lambdify(x, expr, "numpy")
            result = simpson_three_eighths_rule(f, x_start, x_end, n_subintervals)
            return {"method": "Simpson 3/8", "result": result}

        elif "simpson" in requested_method:
            if equation_str is None:
                raise ValueError("Escribe f(x) en el editor matemático para Simpson 1/3. Ejemplo: cos(x)")
            if x_start is None or x_end is None:
                raise ValueError("Llena los campos 'a' y 'b' del intervalo para Simpson 1/3.")
            if n_subintervals is None:
                raise ValueError("Ingresa el número de subintervalos (n) para Simpson 1/3. Debe ser un número par.")
            expr = _parse_expr(equation_str)
            f = sp.lambdify(x, expr, "numpy")
            result = simpson_one_third_rule(f, x_start, x_end, n_subintervals)
            return {"method": "Simpson 1/3", "result": result}

        elif "jacobi" in requested_method:
            if matrix_a is None or vector_b is None:
                raise ValueError("Ingresa la Matriz A y el Vector b para el método de Jacobi.")
            sol, iters, converged = jacobi_method(matrix_a, vector_b, tol=tol, max_iter=max_iter)
            return {"method": "Jacobi", "solution": sol, "iterations": iters, "converged": converged}

        elif "gauss-seidel" in requested_method or "seidel" in requested_method:
            if matrix_a is None or vector_b is None:
                raise ValueError("Ingresa la Matriz A y el Vector b para Gauss-Seidel.")
            sol, iters, converged = gauss_seidel_method(matrix_a, vector_b, tol=tol, max_iter=max_iter)
            return {"method": "Gauss-Seidel", "solution": sol, "iterations": iters, "converged": converged}

        elif "euler-order" in requested_method or ("euler" in requested_method and ("orden" in requested_method or "order" in requested_method)):
            return {"method": "Orden del MÃ©todo de Euler", "order": 1, "local_order": 2}

        elif "euler" in requested_method:
            if equation_str is None:
                raise ValueError("Escribe f(x, y) en el editor matemático para el Método de Euler. Ejemplo: x + y")
            if x0 is None or x_end is None or y0 is None or h is None:
                raise ValueError("Euler requiere todos los campos: x₀, y₀, paso (h) y valor final (xf).")
            expr = _parse_expr(equation_str)
            xs, ys = euler_method(expr, x, y, x0, y0, h, x_end)
            return {"method": "Euler", "x_values": xs, "y_values": ys, "result": ys[-1]}

        elif "rk2" in requested_method:
            if equation_str is None:
                raise ValueError("Escribe f(x, y) en el editor matemático para RK2. Ejemplo: x + y")
            if x0 is None or x_end is None or y0 is None or h is None:
                raise ValueError("RK2 requiere todos los campos: x₀, y₀, paso (h) y valor final (xf).")
            expr = _parse_expr(equation_str)
            xs, ys = rk2_method(expr, x, y, x0, y0, h, x_end)
            return {"method": "RK2", "x_values": xs, "y_values": ys, "result": ys[-1]}

        elif "rk4" in requested_method:
            if equation_str is None:
                raise ValueError("Escribe f(x, y) en el editor matemático para RK4. Ejemplo: -2*y + x")
            if x0 is None or x_end is None or y0 is None or h is None:
                raise ValueError("RK4 requiere todos los campos: x₀, y₀, paso (h) y valor final (xf).")
            expr = _parse_expr(equation_str)
            xs, ys = rk4_method(expr, x, y, x0, y0, h, x_end)
            return {"method": "RK4", "x_values": xs, "y_values": ys, "result": ys[-1]}

        elif "verlet-error" in requested_method or ("verlet" in requested_method and "error" in requested_method):
            if equation_str is None:
                raise ValueError("Escribe f(x, y) en el editor matemático para estimar el error de Verlet.")
            if x0 is None or x_end is None or y0 is None or v0 is None or h is None:
                raise ValueError("Error de Verlet requiere todos los campos: x₀, y₀, v₀, paso (h) y valor final (xf).")
            expr = _parse_expr(equation_str)
            error = verlet_error_estimate(expr, x, y, x0, y0, v0, h, x_end)
            return {"method": "Error del MÃ©todo de Verlet", "error": error}

        elif "verlet" in requested_method:
            if equation_str is None:
                raise ValueError("Escribe f(x, y) en el editor matemático para el Método de Verlet.")
            if x0 is None or x_end is None or y0 is None or v0 is None or h is None:
                raise ValueError("Verlet requiere todos los campos: x₀, y₀, v₀, paso (h) y valor final (xf).")
            expr = _parse_expr(equation_str)
            xs, ys, vs = verlet_method(expr, x, y, x0, y0, v0, h, x_end)
            return {"method": "Verlet", "x_values": xs, "y_values": ys, "v_values": vs, "result": ys[-1]}

    # 2. Decision Engine Logic (Auto)
    if equation_str is None:
        raise ValueError("Escribe una ecuación f(x) en el editor matemático. Ejemplo: x**2 - 4")
    expr = _parse_expr(equation_str)
    f_lamb = sp.lambdify(x, expr, "numpy")
    if x_start is not None and x_end is not None:
        # Check sign change for Bisection
        try:
            f_a = f_lamb(x_start)
            f_b = f_lamb(x_end)
            if f_a * f_b < 0:
                # Bisection is reliable if sign changes
                res, iters = bisection_method(f_lamb, x_start, x_end, tol, max_iter)
                return {
                    "method": "Bisección",
                    "result": res,
                    "iterations": iters,
                    "expression": expr,
                    "symbol": x
                }
        except Exception:
            pass # Fallback to Newton if evaluation fails

    # 2. Prefer Newton-Raphson if differentiability is smooth or no interval provided
    start_point = initial_guess if initial_guess is not None else (x_start + x_end) / 2 if (x_start is not None and x_end is not None) else 0.0
    
    try:
        res, iters = newton_raphson_method(expr, x, start_point, tol, max_iter)
        return {
            "method": "Newton-Raphson",
            "result": res,
            "iterations": iters,
            "expression": expr,
            "symbol": x
        }
    except Exception as e:
        # If Newton fails, try to find any alternative or bubble up the error
        raise ValueError(f"El motor de decisión no pudo encontrar una raíz: {str(e)}")
