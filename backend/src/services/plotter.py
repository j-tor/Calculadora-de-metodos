import numpy as np
import sympy as sp
from typing import List, Dict

def generate_coordinates(expr: sp.Expr, symbol: sp.Symbol, center: float, range_val: float = 10.0, num_points: int = 100) -> List[Dict[str, float]]:
    f_lamb = sp.lambdify(symbol, expr, "numpy")
    
    x_vals = np.linspace(center - range_val, center + range_val, num_points)
    try:
        y_vals = f_lamb(x_vals)
    except Exception:
        # Fallback if evaluation fails on array (e.g. piece-wise or complex functions)
        y_vals = []
        for xi in x_vals:
            try:
                y_vals.append(float(f_lamb(xi)))
            except:
                y_vals.append(None)
        
        return [{"x": float(x), "y": float(y)} for x, y in zip(x_vals, y_vals) if y is not None]

    # Handle cases where lambdify returns constant
    if np.isscalar(y_vals):
        y_vals = np.full_like(x_vals, y_vals)

    coordinates = []
    for x_val, y_val in zip(x_vals, y_vals):
        # Ensure values are JSON serializable and not NaN/Inf
        if np.isfinite(y_val):
            coordinates.append({"x": float(x_val), "y": float(y_val)})
            
    return coordinates
