from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Optional
import os
from ..services.voice_service import transcribe_audio

router = APIRouter(prefix="/api/voice", tags=["Voice"])


def get_groq_api_key():
    """Get Groq API key from environment"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
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
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.get("/health")
async def voice_health_check():
    """Check if voice service is configured"""
    api_key = os.getenv("GROQ_API_KEY")
    return {
        "configured": bool(api_key),
        "message": "Voice service ready" if api_key else "GROQ_API_KEY not set"
    }
