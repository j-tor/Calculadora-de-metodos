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

async def calculate_root_controller(request: CalculationRequest):
    try:
        results = analyze_and_calculate(
            equation_str=request.equation,
            var_name=request.variable,
            x_start=request.x_start,
            x_end=request.x_end,
            initial_guess=request.initial_guess,
            tol=request.tolerance,
            max_iter=request.max_iterations,
            requested_method=request.method,
            g_equation_str=request.g_equation,
            x_values=request.x_values,
            y_values=request.y_values,
            x_eval=request.x_eval,
            matrix_a=request.matrix_a,
            vector_b=request.vector_b,
            matrix_type=request.matrix_type,
            lu_variant=request.lu_variant,
            funcs=request.funcs,
            vars_list=request.vars_list,
            values=request.values,
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
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
