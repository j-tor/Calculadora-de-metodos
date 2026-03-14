from pydantic import BaseModel
from typing import List, Optional, Tuple

class CalculationRequest(BaseModel):
    equation: str
    variable: str = "x"
    # Optional parameters for methods
    x_start: Optional[float] = None
    x_end: Optional[float] = None
    initial_guess: Optional[float] = None
    tolerance: float = 1e-6
    max_iterations: int = 100

class Coordinate(BaseModel):
    x: float
    y: float

class CalculationResponse(BaseModel):
    method_used: str
    result: float
    iterations: int
    coordinates: List[Coordinate]
    message: Optional[str] = None
