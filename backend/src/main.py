import uvicorn
from fastapi import FastAPI
from .routes.calculator import router as calculator_router
from .routes.method_reflection import router as method_reflection_router
from .middleware.cors import setup_cors

app = FastAPI(
    title="Calculadora de Métodos Numéricos API",
    description="API inteligente para resolver ecuaciones usando métodos numéricos.",
    version="1.0.0"
)

# Setup Middlewares
setup_cors(app)

# Include Routes
app.include_router(calculator_router)
app.include_router(method_reflection_router)

@app.get("/")
async def root():
    return {
        "message": "Bienvenido a la API de la Calculadora de Métodos Numéricos",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
