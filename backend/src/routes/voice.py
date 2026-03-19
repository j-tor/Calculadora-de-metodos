from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Optional
import os
from ..services.voice_service import transcribe_audio

router = APIRouter(prefix="/api/voice", tags=["Voice"])


def get_groq_api_key():
    """Get Groq API key from environment"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="El servicio de voz no está configurado. La clave de API GROQ_API_KEY no está configurada en el servidor. "
                  "Contacte al administrador para habilitar la funcionalidad de comandos de voz."
        )
    return api_key


@router.post("/transcribe")
async def transcribe_voice(
    audio: UploadFile = File(...),
    api_key: str = Depends(get_groq_api_key)
):
    """
    Transcribe audio to text using Groq Whisper API
    
    - **audio**: Audio file (webm, wav, mp3, etc.)
    
    Returns transcription text
    """
    try:
        # Validate file type
        allowed_types = ["audio/webm", "audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/mp4"]
        if audio.content_type not in allowed_types:
            # Still try to process as some browsers may send generic types
            pass
        
        result = await transcribe_audio(
            audio_file=audio,
            api_key=api_key,
            language="es",
            prompt="Este es un comando en español para una calculadora de métodos numéricos. Los métodos pueden ser: bisección, punto fijo, Newton, Jacobi, Gauss-Seidel, LU, Lagrange, interpolación de Newton, trazador cúbico."
        )
        
        return {
            "success": True,
            "text": result["text"],
            "language": result["language"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "rate limit" in error_msg.lower() or "quota" in error_msg.lower():
            raise HTTPException(
                status_code=429,
                detail="El servicio de transcripción está temporalmente saturado. "
                      "Por favor, espere unos segundos e intente de nuevo."
            )
        if "api key" in error_msg.lower() or "unauthorized" in error_msg.lower() or "authentication" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail="Error de autenticación con el servicio de voz. "
                      "Contacte al administrador para verificar la configuración de la API."
            )
        if "network" in error_msg.lower() or "connection" in error_msg.lower() or "timeout" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail="No se pudo conectar con el servicio de transcripción. "
                      "Verifique su conexión a internet e intente de nuevo."
            )
        raise HTTPException(
            status_code=500,
            detail="No se pudo transcribir el audio. Verifique que el archivo sea válido (formatos soportados: webm, wav, mp3) "
                  "y que tenga buena calidad de audio. Error técnico: " + error_msg[:100]
        )


@router.get("/health")
async def voice_health_check():
    """Check if voice service is configured"""
    api_key = os.getenv("GROQ_API_KEY")
    return {
        "configured": bool(api_key),
        "message": "Voice service ready" if api_key else "GROQ_API_KEY not set"
    }
