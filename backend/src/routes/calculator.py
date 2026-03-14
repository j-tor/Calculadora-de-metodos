from fastapi import APIRouter
from ..schemas.calculator import CalculationRequest, CalculationResponse
from ..controllers.calculator import calculate_root_controller

router = APIRouter(prefix="/api/calculator", tags=["Calculator"])

@router.post("/calculate", response_model=CalculationResponse)
async def calculate_root(request: CalculationRequest):
    return await calculate_root_controller(request)
