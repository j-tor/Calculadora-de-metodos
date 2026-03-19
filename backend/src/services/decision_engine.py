import numpy as np
import sympy as sp
from sympy import symbols, log, exp, sin, cos, tan, sqrt, pi, E
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

    def _parse_expr(expr_str: str, valid_vars=None) -> sp.Expr:
        if valid_vars is None:
            valid_vars = [x]
        try:
            # Reemplazar '^' por '**' para que SymPy entienda la potenciación
            expr_str = expr_str.replace('^', '**')
            local_dict = {
                'log': log,
                'ln': log,
                'sqrt': sqrt,
                'pi': pi,
                'e': E,
                'E': E,
                'sin': sin,
                'cos': cos,
                'tan': tan,
            }
            expr = sp.parse_expr(expr_str, local_dict=local_dict)
            
            free_syms = expr.free_symbols
            unknown = [str(s) for s in free_syms if s not in valid_vars and str(s) not in ['e', 'pi', 'E', 'I']]
            if unknown:
                unknown_vars = ', '.join(unknown)
                raise ValueError(f"La ecuación contiene variables que no reconocemos: {unknown_vars}. "
                                f"Use únicamente la variable '{var_name}' y constantes conocidas (pi, e). "
                                f"Ejemplo correcto: {var_name}**2 - 4*{var_name} + 3. "
                                f"Recuerde usar '*' para multiplicación (ej: 3*{var_name} en lugar de 3{var_name}).")
                
            return expr
        except ValueError as ve:
            raise ve
        except Exception as e:
            error_str = str(e)
            if "unexpected indent" in error_str or "invalid syntax" in error_str:
                raise ValueError(f"La ecuación tiene errores de sintaxis. "
                                f"Verifique que use operadores correctamente: +, -, *, /, ** para potencias. "
                                f"Ejemplo: {var_name}**3 - 2*{var_name} + 1")
            raise ValueError(f"No pudimos interpretar la ecuación. Error: {error_str}. "
                            f"Verifique que esté escrita en notación matemática estándar.")

    # 1. Manual selection bypass
    if requested_method:
        requested_method = requested_method.lower()
        if "bisec" in requested_method:
            if equation_str is None:
                raise ValueError("El método de Bisección requiere una ecuación. "
                                "Proporcione la función f(x) = 0 que desea resolver.")
            expr = _parse_expr(equation_str)
            f_lamb = sp.lambdify(x, expr, "numpy")
            if x_start is None or x_end is None:
                raise ValueError("El método de Bisección requiere un intervalo [a, b]. "
                                "Proporcione los valores de x_start (a) y x_end (b) donde la función cambia de signo.")
            res, iters, history = bisection_method(f_lamb, x_start, x_end, tol, max_iter)
            x_vals = [step["x"] for step in history]
            y_vals = [step["y"] for step in history]
            errors = [step["error"] for step in history]
            return {
                "method": "Bisección",
                "result": res,
                "iterations": iters,
                "expression": expr,
                "symbol": x,
                "x_values": x_vals,
                "y_values": y_vals,
                "error": errors
            }

        
        elif "newton-divided" in requested_method or ("newton" in requested_method and "interpol" in requested_method):
            if x_values is None or y_values is None:
                raise ValueError("La interpolación de Newton requiere puntos de datos (x_values, y_values). "
                                "Proporcione al menos dos pares de valores (x, y) para construir el polinomio.")
            coef = newton_divided_differences(x_values, y_values)
            value = None
            if x_eval is not None:
                value = newton_interpolation_eval(x_values, coef, x_eval)
            return {
                "method": "Interpolación de Newton",
                "coefficients": coef,
                "value": value,
                "x_eval": x_eval,
                "x_values": list(x_values),
                "y_values": list(y_values),
            }

        elif "newton" in requested_method and "interpol" not in requested_method:
            if equation_str is None:
                raise ValueError("El método de Newton-Raphson requiere una ecuación. "
                                "Proporcione la función f(x) = 0 que desea resolver.")
            expr = _parse_expr(equation_str)
            start_point = initial_guess if initial_guess is not None else (x_start + x_end) / 2 if (x_start is not None and x_end is not None) else 0.0
            res, iters, history = newton_raphson_method(expr, x, start_point, tol, max_iter)
            x_vals = [step["x"] for step in history]
            y_vals = [step["y"] for step in history]
            error = [step["error"] for step in history]
            return {"method": "Newton-Raphson", "result": res, "iterations": iters, "expression": expr, "symbol": x, "x_values": x_vals, "y_values": y_vals, "error":error}

        elif "punto fijo" in requested_method or "fixed" in requested_method:
            expr_str = g_equation_str if g_equation_str is not None else equation_str
            if expr_str is None:
                raise ValueError("El método de Punto Fijo requiere una función g(x). "
                                "Proporcione g(x) tal que x = g(x) en el punto fijo, o la ecuación original f(x) = 0.")
            g_expr = _parse_expr(expr_str)
            start_point = initial_guess if initial_guess is not None else (x_start + x_end) / 2 if (x_start is not None and x_end is not None) else 0.0
            res, iters, history = fixed_point_method(g_expr, x, start_point, tol, max_iter)
            x_vals = [step["x"] for step in history]
            y_vals = [step["y"] for step in history]
            error = [step["error"] for step in history]
            return {"method": "Punto Fijo", "result": res, "iterations": iters, "expression": g_expr, "symbol": x, "x_values": x_vals, "y_values": y_vals, "error": error}

        elif "convergenciafija" in requested_method or "convergencia fija" in requested_method or "convergence" in requested_method:
            expr_str = g_equation_str if g_equation_str is not None else equation_str
            if expr_str is None:
                raise ValueError("La verificación de convergencia de Punto Fijo requiere una función g(x). "
                                "Proporcione g(x) para verificar si el método convergerá.")
            g_expr = _parse_expr(expr_str)
            interval = (x_start, x_end) if (x_start is not None and x_end is not None) else None
            converges = fixed_point_convergence(g_expr, x, x0=initial_guess, interval=interval)
            return {"method": "Convergencia Fija", "converges": converges, "expression": g_expr, "symbol": x}

        elif "lagrange" in requested_method:
            if x_values is None or y_values is None:
                raise ValueError("La interpolación de Lagrange requiere puntos de datos (x_values, y_values). "
                                "Proporcione los pares de valores (x, y) para construir el polinomio interpolante.")
            value = None
            if x_eval is not None:
                value = lagrange_interpolation(x_values, y_values, x_eval)
            poly = lagrange_polynomial(x_values, y_values)
            return {
                "method": "Lagrange",
                "value": value,
                "polynomial": poly,
                "x_eval": x_eval,
                "x_values": list(x_values),
                "y_values": list(y_values),
            }

        elif "polinomica" in requested_method or "polynomial" in requested_method:
            if x_values is None or y_values is None:
                raise ValueError("La interpolación polinómica requiere puntos de datos (x_values, y_values). "
                                "Proporcione los pares de valores (x, y) para construir el polinomio.")
            coeffs = polynomial_interpolation_coeffs(x_values, y_values)
            value = None
            if x_eval is not None:
                value = polynomial_interpolation_eval(coeffs, x_eval)
            return {"method": "Interpolación Polinómica", "coefficients": coeffs, "value": value, "x_eval": x_eval}

        elif "trazos" in requested_method or "spline" in requested_method or "cubicos" in requested_method:
            if x_values is None or y_values is None:
                raise ValueError("El trazador cúbico (spline) requiere puntos de datos (x_values, y_values). "
                                "Proporcione los pares de valores (x, y) para construir la curva suave que pase por todos los puntos.")
            coeffs = cubic_spline_coeffs(x_values, y_values)
            value = None
            if x_eval is not None:
                value = cubic_spline_eval(x_values, coeffs, x_eval)
            return {
                "method": "Trazos Cúbicos",
                "coefficients": coeffs,
                "value": value,
                "x_eval": x_eval,
                "x_values": list(x_values),
                "y_values": list(y_values),
            }

        elif "matriz" in requested_method or "triangular" in requested_method or "diagonal" in requested_method:
            if matrix_a is None or vector_b is None:
                raise ValueError("La resolución de sistemas triangulares requiere la matriz A y el vector b. "
                                "Proporcione matrix_a (matriz de coeficientes) y vector_b (términos independientes).")
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
            raise ValueError(f"El parámetro matrix_type debe ser 'upper' (superior), 'lower' (inferior) o 'diagonal'. "
                            f"Recibido: {matrix_type}")

        elif "lu" in requested_method or "doolittle" in requested_method or "crout" in requested_method or "kourt" in requested_method or "krout" in requested_method:
            if matrix_a is None:
                raise ValueError("La descomposición LU requiere la matriz A. "
                                "Proporcione matrix_a (matriz de coeficientes cuadrada) para factorizarla en L y U.")
            variant = lu_variant
            if variant is None:
                if "doolittle" in requested_method:
                    variant = "doolittle"
                elif "crout" in requested_method or "kourt" in requested_method or "krout" in requested_method:
                    variant = "crout"
                else:
                    variant = "doolittle"
            if variant == "doolittle":
                L, U = lu_doolittle(matrix_a)
            elif variant == "crout":
                L, U = lu_crout(matrix_a)
            else:
                valid_variants = "doolittle o crout"
                raise ValueError(f"La variante de LU '{lu_variant}' no es válida. "
                                f"Use '{valid_variants}'. "
                                f"Doolittle: L tiene 1s en la diagonal. Crout: U tiene 1s en la diagonal.")
            sol = None
            if vector_b is not None:
                sol = lu_solve(L, U, vector_b)
            return {"method": f"LU ({variant})", "L": L, "U": U, "solution": sol}

        elif "jacobiano" in requested_method or "jacobian" in requested_method:
            if funcs is None or vars_list is None:
                raise ValueError("El cálculo del Jacobiano requiere las funciones y las variables. "
                                "Proporcione funcs (lista de funciones) y vars_list (lista de nombres de variables).")
            vars_syms = [sp.symbols(v) for v in vars_list]
            funcs_expr = [_parse_expr(f, valid_vars=vars_syms) for f in funcs]
            J = jacobian_matrix(funcs_expr, vars_syms)
            J_num = None
            if values is not None:
                J_num = jacobian_evaluate(funcs_expr, vars_syms, values)
            return {"method": "Jacobiano", "jacobian": J, "jacobian_numeric": J_num}

        elif "trapec" in requested_method or "trapez" in requested_method:
            if equation_str is None:
                raise ValueError("La regla del Trapecio requiere una función. "
                                "Proporcione equation_str con la función f(x) a integrar.")
            if x_start is None or x_end is None:
                raise ValueError("La regla del Trapecio requiere los límites de integración. "
                                "Proporcione x_start (límite inferior) y x_end (límite superior).")
            if n_subintervals is None:
                raise ValueError("La regla del Trapecio requiere el número de subintervalos. "
                                "Proporcione n_subintervals (cantidad de segmentos para la aproximación).")
            expr = _parse_expr(equation_str)
            f = sp.lambdify(x, expr, "numpy")
            result = trapezoidal_rule(f, x_start, x_end, n_subintervals)
            # Add simple coordinates for visualization
            x_vals = np.linspace(x_start, x_end, n_subintervals + 1)
            y_vals = f(x_vals)
            return {"method": "Regla del Trapecio", "result": result, "x_values": x_vals, "y_values": y_vals}

        elif "simpson" in requested_method and ("3/8" in requested_method or "3-8" in requested_method or "3 8" in requested_method):
            if equation_str is None:
                raise ValueError("La regla de Simpson 3/8 requiere una función. "
                                "Proporcione equation_str con la función f(x) a integrar.")
            if x_start is None or x_end is None:
                raise ValueError("La regla de Simpson 3/8 requiere los límites de integración x_start y x_end.")
            if n_subintervals is None:
                raise ValueError("La regla de Simpson 3/8 requiere n_subintervalos. "
                                "Debe ser múltiplo de 3 (ej: 3, 6, 9, 12, ...).")
            expr = _parse_expr(equation_str)
            f = sp.lambdify(x, expr, "numpy")
            result = simpson_three_eighths_rule(f, x_start, x_end, n_subintervals)
            x_vals = np.linspace(x_start, x_end, n_subintervals + 1)
            y_vals = f(x_vals)
            return {"method": "Simpson 3/8", "result": result, "x_values": x_vals, "y_values": y_vals}

        elif "simpson" in requested_method:
            if equation_str is None:
                raise ValueError("La regla de Simpson 1/3 requiere una función. "
                                "Proporcione equation_str con la función f(x) a integrar.")
            if x_start is None or x_end is None:
                raise ValueError("La regla de Simpson 1/3 requiere los límites de integración x_start y x_end.")
            if n_subintervals is None:
                raise ValueError("La regla de Simpson 1/3 requiere n_subintervalos. "
                                "Debe ser un número par (ej: 2, 4, 6, 8, 10, ...).")
            expr = _parse_expr(equation_str)
            f = sp.lambdify(x, expr, "numpy")
            result = simpson_one_third_rule(f, x_start, x_end, n_subintervals)
            x_vals = np.linspace(x_start, x_end, n_subintervals + 1)
            y_vals = f(x_vals)
            return {"method": "Simpson 1/3", "result": result, "x_values": x_vals, "y_values": y_vals}

        elif "jacobi" in requested_method:
            if matrix_a is None or vector_b is None:
                raise ValueError("El método de Jacobi requiere el sistema Ax = b. "
                                "Proporcione matrix_a (matriz de coeficientes cuadrada) y vector_b (términos independientes).")
            sol, iters, converged, errors = jacobi_method(matrix_a, vector_b, tol=tol, max_iter=max_iter)
            return {
                "method": "Jacobi",
                "solution": sol,
                "iterations": iters,
                "converged": converged,
                "error": errors,  # controlador -> errors + error(ultimo)
                "tolerance": tol,
            }

        elif "gauss-seidel" in requested_method or "seidel" in requested_method:
            if matrix_a is None or vector_b is None:
                raise ValueError("El método de Gauss-Seidel requiere el sistema Ax = b. "
                                "Proporcione matrix_a (matriz de coeficientes cuadrada) y vector_b (términos independientes).")
            sol, iters, converged, errors = gauss_seidel_method(matrix_a, vector_b, tol=tol, max_iter=max_iter)
            return {
                "method": "Gauss-Seidel",
                "solution": sol,
                "iterations": iters,
                "converged": converged,
                "error": errors,  # controlador -> errors + error(ultimo)
                "tolerance": tol,
            }

        elif "euler-order" in requested_method or ("euler" in requested_method and ("orden" in requested_method or "order" in requested_method)):
            return {"method": "Orden del MÃ©todo de Euler", "order": 1, "local_order": 2}

        elif "euler" in requested_method:
            if equation_str is None:
                raise ValueError("El método de Euler requiere una ecuación diferencial dy/dx = f(x,y). "
                                "Proporcione equation_str con la función f(x,y).")
            if x0 is None or x_end is None or y0 is None or h is None:
                raise ValueError("El método de Euler requiere: x0 (valor inicial de x), x_end (valor final de x), "
                                "y0 (condición inicial y(x0)), y h (tamaño de paso).")
            expr = _parse_expr(equation_str, valid_vars=[x, y])
            xs, ys = euler_method(expr, x, y, x0, y0, h, x_end)
            return {"method": "Euler", "x_values": xs, "y_values": ys, "result": ys[-1]}

        elif "rk2" in requested_method:
            if equation_str is None:
                raise ValueError("El método RK2 (Runge-Kutta de orden 2) requiere una ecuación diferencial dy/dx = f(x,y). "
                                "Proporcione equation_str con la función f(x,y).")
            if x0 is None or x_end is None or y0 is None or h is None:
                raise ValueError("El método RK2 requiere: x0 (valor inicial de x), x_end (valor final de x), "
                                "y0 (condición inicial y(x0)), y h (tamaño de paso).")
            expr = _parse_expr(equation_str, valid_vars=[x, y])
            xs, ys = rk2_method(expr, x, y, x0, y0, h, x_end)
            return {"method": "RK2", "x_values": xs, "y_values": ys, "result": ys[-1]}

        elif "rk4" in requested_method:
            if equation_str is None:
                raise ValueError("El método RK4 (Runge-Kutta de orden 4) requiere una ecuación diferencial dy/dx = f(x,y). "
                                "Proporcione equation_str con la función f(x,y).")
            if x0 is None or x_end is None or y0 is None or h is None:
                raise ValueError("El método RK4 requiere: x0 (valor inicial de x), x_end (valor final de x), "
                                "y0 (condición inicial y(x0)), y h (tamaño de paso).")
            expr = _parse_expr(equation_str, valid_vars=[x, y])
            xs, ys = rk4_method(expr, x, y, x0, y0, h, x_end)
            return {"method": "RK4", "x_values": xs, "y_values": ys, "result": ys[-1]}

        elif "verlet-error" in requested_method or ("verlet" in requested_method and "error" in requested_method):
            if equation_str is None:
                raise ValueError("El cálculo de error de Verlet requiere una función de aceleración. "
                                "Proporcione equation_str con la función g(x,y) para la aceleración.")
            if x0 is None or x_end is None or y0 is None or v0 is None or h is None:
                raise ValueError("El error de Verlet requiere: x0, x_end, y0 (posición inicial), "
                                "v0 (velocidad inicial), y h (tamaño de paso).")
            expr = _parse_expr(equation_str, valid_vars=[x, y])
            error = verlet_error_estimate(expr, x, y, x0, y0, v0, h, x_end)
            return {"method": "Error del Método de Verlet", "error": error}

        elif "verlet" in requested_method:
            if equation_str is None:
                raise ValueError("El método de Verlet requiere una función de aceleración. "
                                "Proporcione equation_str con la función g(x,y) para la aceleración.")
            if x0 is None or x_end is None or y0 is None or v0 is None or h is None:
                raise ValueError("El método de Verlet requiere: x0, x_end, y0 (posición inicial), "
                                "v0 (velocidad inicial), y h (tamaño de paso).")
            expr = _parse_expr(equation_str, valid_vars=[x, y])
            xs, ys, vs = verlet_method(expr, x, y, x0, y0, v0, h, x_end)
            return {"method": "Verlet", "x_values": xs, "y_values": ys, "v_values": vs, "result": ys[-1]}

    # 2. Decision Engine Logic (Auto)
    if equation_str is None:
        raise ValueError("El modo automático requiere una ecuación para analizar. "
                        "Proporcione equation_str con la función que desea resolver.")
    expr = _parse_expr(equation_str)
    f_lamb = sp.lambdify(x, expr, "numpy")
    if x_start is not None and x_end is not None:
        # Check sign change for Bisection
        try:
            f_a = f_lamb(x_start)
            f_b = f_lamb(x_end)
            if f_a * f_b < 0:
                # Bisection is reliable if sign changes
                res, iters, history = bisection_method(f_lamb, x_start, x_end, tol, max_iter)
                x_vals = [step["x"] for step in history]
                y_vals = [step["y"] for step in history]
                return {
                    "method": "Bisección",
                    "result": res,
                    "iterations": iters,
                    "expression": expr,
                    "symbol": x,
                    "x_values": x_vals,
                    "y_values": y_vals
                }
        except Exception:
            pass # Fallback to Newton if evaluation fails

    # 2. Prefer Newton-Raphson if differentiability is smooth or no interval provided
    start_point = initial_guess if initial_guess is not None else (x_start + x_end) / 2 if (x_start is not None and x_end is not None) else 0.0
    
    try:
        res, iters, history = newton_raphson_method(expr, x, start_point, tol, max_iter)
        x_vals = [step["x"] for step in history]
        y_vals = [step["y"] for step in history]
        return {
            "method": "Newton-Raphson",
            "result": res,
            "iterations": iters,
            "expression": expr,
            "symbol": x,
            "x_values": x_vals,
            "y_values": y_vals
        }
    except Exception as e:
        # If Newton fails, try to find any alternative or bubble up the error
        error_msg = str(e)
        raise ValueError(f"El motor de decisión no pudo encontrar una raíz automáticamente. "
                        f"Error: {error_msg}. "
                        f"Intente especificar un método manualmente (bisección, Newton-Raphson) "
                        f"y verifique que los parámetros sean correctos.")
