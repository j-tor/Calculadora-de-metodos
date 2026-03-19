from fastapi import HTTPException
from ..schemas.calculator import CalculationRequest, CalculationResponse, Coordinate
from ..services.decision_engine import analyze_and_calculate
from ..services.plotter import generate_coordinates


def _tolist(value):
    if value is None:
        return None
    if hasattr(value, "tolist"):
        return value.tolist()
    return value

def _extract_errors(value):
    if value is None:
        return None, None
    if isinstance(value, (list, tuple)):
        if len(value) == 0:
            return None, None
        return _tolist(value), value[-1]
    if hasattr(value, "tolist"):
        value_list = value.tolist()
        if not value_list:
            return None, None
        return value_list, value_list[-1]
    if isinstance(value, (int, float)):
        return None, value
    return None, None


def _parse_vector(value: str):
    if value is None:
        return None
    parts = [p.strip() for p in value.split(",") if p.strip() != ""]
    return [float(p) for p in parts]

def _parse_matrix(value: str):
    if value is None:
        return None
    rows = [row.strip() for row in value.split(";") if row.strip() != ""]
    matrix = []
    for row in rows:
        parts = [p.strip() for p in row.split(",") if p.strip() != ""]
        matrix.append([float(p) for p in parts])
    return matrix

async def calculate_root_controller(request: CalculationRequest):
    try:
        x_start = request.x_start if request.x_start is not None else request.a
        x_end = request.x_end if request.x_end is not None else request.b
        if request.xf is not None:
            x_end = request.xf
        initial_guess = request.initial_guess if request.initial_guess is not None else request.x0
        n_subintervals = request.n_subintervals if request.n_subintervals is not None else request.n
        max_iterations = request.max_iterations if request.maxIter is None else request.maxIter
        matrix_a = request.matrix_a if request.matrix_a is not None else _parse_matrix(request.matrixA)
        vector_b = request.vector_b if request.vector_b is not None else _parse_vector(request.vectorB)

        results = analyze_and_calculate(
            equation_str=request.equation,
            var_name=request.variable,
            x_start=x_start,
            initial_guess=initial_guess,
            tol=request.tolerance,
            max_iter=max_iterations,
            requested_method=request.method,
            g_equation_str=request.g_equation,
            x_values=request.x_values,
            y_values=request.y_values,
            x_eval=request.x_eval,
            matrix_a=matrix_a,
            vector_b=vector_b,
            matrix_type=request.matrix_type,
            lu_variant=request.lu_variant,
            funcs=request.funcs,
            vars_list=request.vars_list,
            values=request.values,
            n_subintervals=n_subintervals,
            x0=request.x0,
            x_end=x_end,
            y0=request.y0,
            v0=request.v0,
            h=request.h,
        )

        coordinates = None
        if "expression" in results and "symbol" in results and "result" in results:
            coords_data = generate_coordinates(
                expr=results["expression"],
                symbol=results["symbol"],
                center=results["result"]
            )
            coordinates = [Coordinate(x=c["x"], y=c["y"]) for c in coords_data]

        spline_coeffs = None
        if "coefficients" in results and results.get("method") == "Trazos Cúbicos":
            a, b, c, d = results["coefficients"]
            spline_coeffs = {
                "a": _tolist(a),
                "b": _tolist(b),
                "c": _tolist(c),
                "d": _tolist(d),
            }
        errors, last_error = _extract_errors(results.get("error"))

        return CalculationResponse(
            method_used=results.get("method", ""),
            result=results.get("result"),
            iterations=results.get("iterations"),
            coordinates=coordinates,
            message=f"Cálculo exitoso usando el método de {results.get('method', '')}.",
            converges=results.get("converges"),
            value=results.get("value"),
            polynomial=str(results["polynomial"]) if results.get("polynomial") is not None else None,
            coefficients=_tolist(results.get("coefficients")) if results.get("method") != "Trazos Cúbicos" else None,
            spline_coefficients=spline_coeffs,
            solution=_tolist(results.get("solution")),
            l_matrix=_tolist(results.get("L")),
            u_matrix=_tolist(results.get("U")),
            jacobian=str(results["jacobian"]) if results.get("jacobian") is not None else None,
            jacobian_numeric=_tolist(results.get("jacobian_numeric")),
            x_values=_tolist(results.get("x_values")),
            y_values=_tolist(results.get("y_values")),
            v_values=_tolist(results.get("v_values")),
            order=results.get("order"),
            local_order=results.get("local_order"),
            errors=errors,
            error=last_error,
            converged=results.get("converged"),
            x_eval=results.get("x_eval"),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except (TypeError, AttributeError, NotImplementedError, NameError) as e:
        raise HTTPException(status_code=400, detail="No se pudo evaluar la función matemática. Verifique que esté escrita correctamente (ej. use '*' para multiplicar, respete los paréntesis).")
    except Exception as e:
        error_msg = str(e)
        if "ufunc" in error_msg or "Symbol" in error_msg or "math domain error" in error_msg:
             raise HTTPException(status_code=400, detail="La ecuación no se pudo evaluar. Verifique la sintaxis u operaciones matemáticas inválidas.")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {error_msg}")
