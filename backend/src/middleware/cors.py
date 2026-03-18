import os
from fastapi.middleware.cors import CORSMiddleware

def setup_cors(app):
    # Intentamos leer la URL de Vercel desde una variable de entorno
    # Si no existe, usamos un valor por defecto para no romper la app
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    origins = [
        "http://localhost:5173",             # Local (Vite)
        "http://127.0.0.1:5173",            # Local (Alternativo)
        "https://calculadorademetodos.vercel.app", # ProducciÃ³n (Vercel)
        frontend_url,                        # ProducciÃ³n (Configurable vía env)
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )