from fastapi import HTTPException
from ..schemas.calculator import CalculationRequest, CalculationResponse, Coordinate
from ..services.decision_engine import analyze_and_calculate
from ..services.plotter import generate_coordinates

async def calculate_root_controller(request: CalculationRequest):
    try:
        # 1. Analyze equation and calculate using the best method
        results = analyze_and_calculate(
            equation_str=request.equation,
            var_name=request.variable,
            x_start=request.x_start,
            x_end=request.x_end,
            initial_guess=request.initial_guess,
            tol=request.tolerance,
            max_iter=request.max_iterations,
            requested_method=request.method
        )
        
        # 2. Generate plotting coordinates
        coords_data = generate_coordinates(
            expr=results["expression"],
            symbol=results["symbol"],
            center=results["result"]
        )
        
        # 3. Format response
        coordinates = [Coordinate(x=c["x"], y=c["y"]) for c in coords_data]
        
        return CalculationResponse(
            method_used=results["method"],
            result=results["result"],
            iterations=results["iterations"],
            coordinates=coordinates,
            message=f"Cálculo exitoso usando el método de {results['method']}."
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
