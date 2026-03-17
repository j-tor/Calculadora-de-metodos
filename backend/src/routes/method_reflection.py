import inspect
from typing import get_type_hints, Callable, Sequence, Any, List
import sympy as sp
from fastapi import APIRouter
from pydantic import BaseModel

from ..services import methods as num_methods

router = APIRouter(prefix="/api/methods", tags=["methods"])

# Defining the mapping of method namespaces
METHOD_REGISTRY = {
    # No Lineales
    "bisection_method": {"display_name": "Bisección", "category": "Ecuaciones No Lineales", "keywords": ["biseccion", "bisección", "bisection", "biseccionar"]},
    "newton_raphson_method": {"display_name": "Newton Raphson", "category": "Ecuaciones No Lineales", "keywords": ["newton", "raphson", "newton raphson"]},
    "fixed_point_method": {"display_name": "Punto Fijo", "category": "Ecuaciones No Lineales", "keywords": ["punto fijo", "fijo", "fixed point"]},
    
    # Sistemas
    "jacobi_method": {"display_name": "Jacobi", "category": "Sistemas de Ecuaciones", "keywords": ["jacobi"]},
    "gauss_seidel_method": {"display_name": "Gauss Seidel", "category": "Sistemas de Ecuaciones", "keywords": ["gauss", "seidel", "gauss seidel"]},
    "lu_decomposition_method": {"display_name": "Descomposición LU", "category": "Sistemas de Ecuaciones", "keywords": ["lu", "descomposicion lu", "crout", "doolittle"]},
    
    # Interpolacion
    "lagrange_interpolation": {"display_name": "Interpolación de Lagrange", "category": "Interpolación", "keywords": ["lagrange", "interpolacion", "interpolación"]},
    "newton_interpolation": {"display_name": "Diferencias Divididas de Newton", "category": "Interpolación", "keywords": ["diferencias divididas", "newton interpolacion"]},
    
    # Integracion
    "trapezoidal_rule": {"display_name": "Regla del Trapecio", "category": "Integración Numérica", "keywords": ["trapecio", "trapezoidal"]},
    "simpson_one_third": {"display_name": "Simpson 1/3", "category": "Integración Numérica", "keywords": ["simpson", "un tercio", "1/3", "uno sobre tres"]},
    "simpson_three_eighth": {"display_name": "Simpson 3/8", "category": "Integración Numérica", "keywords": ["simpson", "tres octavos", "3/8", "tres sobre ocho"]},
    
    # EDOs
    "euler_method": {"display_name": "Método de Euler", "category": "Ecuaciones Diferenciales", "keywords": ["euler"]},
    "euler_method_order": {"display_name": "Euler de Orden Superior", "category": "Ecuaciones Diferenciales", "keywords": ["euler orden", "orden", "orden superior"]},
    "verlet_method": {"display_name": "Método de Verlet", "category": "Ecuaciones Diferenciales", "keywords": ["verlet"]},
    "verlet_error": {"display_name": "Error de Verlet", "category": "Ecuaciones Diferenciales", "keywords": ["error verlet", "verlet error"]},
    "runge_kutta_2": {"display_name": "Runge Kutta 2", "category": "Ecuaciones Diferenciales", "keywords": ["runge kutta dos", "rk2", "runge kutta 2", "orden 2"]},
    "runge_kutta_4": {"display_name": "Runge Kutta 4", "category": "Ecuaciones Diferenciales", "keywords": ["runge kutta cuatro", "rk4", "runge kutta 4", "orden 4"]},
}

def map_param_type(param_type: Any) -> str:
    type_str = str(param_type).lower()
    
    if "callable" in type_str or "expr" in type_str:
        return "function"
    
    if "sequence" in type_str or "list" in type_str or "tuple" in type_str or "ndarray" in type_str:
        if "sequence[sequence" in type_str or "list[list" in type_str:
            return "matrix"
        try:
            from typing import get_origin, get_args
            origin = get_origin(param_type)
            args = get_args(param_type)
            if origin in (Sequence, list, tuple) and args:
                if get_origin(args[0]) in (Sequence, list, tuple):
                    return "matrix"
        except:
            pass
        return "vector"
    
    return "scalar"
    
@router.get("/meta")
async def get_methods_meta():
    methods_list = []
    
    for method_id, meta in METHOD_REGISTRY.items():
        func = getattr(num_methods, method_id, None)
        parameters = []
        if func:
            try:
                sig = inspect.signature(func)
                hints = get_type_hints(func)
                for name, param in sig.parameters.items():
                    if name in ("x_sym", "vars", "funcs"): 
                        # Skip symbolic variables that don't map clearly
                        continue
                    
                    # Also skip "f_prime" or derivatives if we want users only to enter "f"
                    # But if required, let's just map it.
                    
                    param_type_hint = hints.get(name, param.annotation)
                    mapped_type = map_param_type(param_type_hint)
                    
                    required = param.default == inspect.Parameter.empty
                    
                    param_dict = {
                        "name": name,
                        "type": mapped_type,
                        "label": f"Parámetro {name}",
                        "required": required
                    }
                    
                    if not required:
                        param_dict["default"] = param.default if param.default is not None else ""
                    
                    if name in ["f", "f_expr", "g_expr"]:
                        param_dict["label"] = f"Función {name}(x)"
                    elif name in ["a", "x0"]:
                        param_dict["label"] = f"Valor inicial {name}"
                    elif name == "b":
                        param_dict["label"] = "Límite superior b"
                    elif name in ["tol", "tolerance"]:
                        param_dict["label"] = "Tolerancia"
                        if not required and not param_dict.get("default"):
                            param_dict["default"] = 1e-6
                    elif name == "max_iter":
                        param_dict["label"] = "Iteraciones"
                        if not required and not param_dict.get("default"):
                            param_dict["default"] = 100
                    elif name in ["x_vals", "y_vals"]:
                        param_dict["label"] = f"Puntos {name[0].upper()}"
                    elif name in ["A", "U", "L"]:
                        param_dict["label"] = f"Matriz {name}"
                    elif name == "x":
                        param_dict["label"] = "Valor a evaluar x"
                        
                    parameters.append(param_dict)
            except Exception as e:
                print(f"Error mapping signature for {method_id}: {e}")

        method_data = {
            "id": method_id,
            "display_name": meta["display_name"],
            "category": meta["category"],
            "keywords": meta["keywords"],
            "parameters": parameters
        }
        methods_list.append(method_data)
        
    return {"methods": methods_list}
