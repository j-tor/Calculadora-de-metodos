from pydantic import BaseModel
from typing import List, Optional, Dict

class CalculationRequest(BaseModel):
    equation: Optional[str] = None
    variable: str = "x"
    method: Optional[str] = None # NEW: To specify "Bisección" or "Newton-Raphson"
    # Optional parameters for methods
    x_start: Optional[float] = None
    x_end: Optional[float] = None
    initial_guess: Optional[float] = None
    # Frontend aliases
    a: Optional[float] = None
    b: Optional[float] = None
    n: Optional[int] = None
    x0: Optional[float] = None
    xf: Optional[float] = None
    maxIter: Optional[int] = None
    matrixA: Optional[str] = None
    vectorB: Optional[str] = None
    tolerance: float = 1e-6
    max_iterations: int = 100
    # Fixed point
    g_equation: Optional[str] = None
    # Interpolation inputs
    x_values: Optional[List[float]] = None
    y_values: Optional[List[float]] = None
    x_eval: Optional[float] = None
    # Linear systems
    matrix_a: Optional[List[List[float]]] = None
    vector_b: Optional[List[float]] = None
    matrix_type: Optional[str] = None
    lu_variant: Optional[str] = None
    # Jacobian
    funcs: Optional[List[str]] = None
    vars_list: Optional[List[str]] = None
    values: Optional[List[float]] = None
    # Integration
    n_subintervals: Optional[int] = None
    # ODE inputs
    y0: Optional[float] = None
    v0: Optional[float] = None
    h: Optional[float] = None

class Coordinate(BaseModel):
    x: float
    y: float

class CalculationResponse(BaseModel):
    method_used: str
    result: Optional[float] = None
    iterations: Optional[int] = None
    coordinates: Optional[List[Coordinate]] = None
    message: Optional[str] = None
    # Extra outputs for extended methods
    converges: Optional[bool] = None
    value: Optional[float] = None
    polynomial: Optional[str] = None
    coefficients: Optional[List[float]] = None
    spline_coefficients: Optional[Dict[str, List[float]]] = None
    solution: Optional[List[float]] = None
    l_matrix: Optional[List[List[float]]] = None
    u_matrix: Optional[List[List[float]]] = None
    jacobian: Optional[str] = None
    jacobian_numeric: Optional[List[List[float]]] = None
    x_values: Optional[List[float]] = None
    y_values: Optional[List[float]] = None
    v_values: Optional[List[float]] = None
    order: Optional[int] = None
    local_order: Optional[int] = None
    error: Optional[float] = None
    converged: Optional[bool] = None
