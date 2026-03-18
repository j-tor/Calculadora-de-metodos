from fastapi.middleware.cors import CORSMiddleware

def setup_cors(app):
    origins = [
        "http://localhost:5173",          # Para pruebas en tu PC
        "https://tu-proyecto.vercel.app", # LA URL QUE TE DE VERCEL
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )