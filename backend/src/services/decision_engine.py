import sympy as sp
from typing import Tuple, Dict, Any
from .methods import bisection_method, newton_raphson_method

def analyze_and_calculate(
    equation_str: str, 
    var_name: str, 
    x_start: float = None, 
    x_end: float = None, 
    initial_guess: float = None,
    tol: float = 1e-6,
    max_iter: int = 100,
    requested_method: str = None # NEW
) -> Dict[str, Any]:
    x = sp.symbols(var_name)
    try:
        expr = sp.parse_expr(equation_str)
    except Exception as e:
        raise ValueError(f"Error al interpretar la ecuación: {str(e)}")

    f_lamb = sp.lambdify(x, expr, "numpy")

    # 1. Manual selection bypass
    if requested_method:
        requested_method = requested_method.lower()
        if "bisec" in requested_method:
            if x_start is None or x_end is None:
                raise ValueError("El método de Bisección requiere un intervalo (x_start, x_end).")
            res, iters = bisection_method(f_lamb, x_start, x_end, tol, max_iter)
            return {"method": "Bisección", "result": res, "iterations": iters, "expression": expr, "symbol": x}
        
        elif "newton" in requested_method:
            start_point = initial_guess if initial_guess is not None else (x_start + x_end) / 2 if (x_start is not None and x_end is not None) else 0.0
            res, iters = newton_raphson_method(expr, x, start_point, tol, max_iter)
            return {"method": "Newton-Raphson", "result": res, "iterations": iters, "expression": expr, "symbol": x}

    # 2. Decision Engine Logic (Auto)
    if x_start is not None and x_end is not None:
        # Check sign change for Bisection
        f_lamb = sp.lambdify(x, expr, "numpy")
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
