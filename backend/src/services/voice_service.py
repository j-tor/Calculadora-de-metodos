"""Voice recognition service using Groq Whisper API"""

import httpx
from typing import Optional
from fastapi import UploadFile

GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"


async def transcribe_audio(
    audio_file: UploadFile,
    api_key: str,
    language: str = "es",
    prompt: Optional[str] = None
) -> dict:
    """
    Transcribe audio using Groq Whisper API
    
    Args:
        audio_file: Audio file from UploadFile
        api_key: Groq API key
        language: Language code (default 'es' for Spanish)
        prompt: Optional prompt to guide transcription
    
    Returns:
        dict with transcription text and detected method/parameters
    """
    # Read audio content
    audio_content = await audio_file.read()
    
    # Prepare multipart form data
    files = {
        "file": (audio_file.filename, audio_content, audio_file.content_type or "audio/webm")
    }
    
    data = {
        "model": "whisper-large-v3",
        "language": language,
        "response_format": "json",
        "temperature": 0.0  # More deterministic for commands
    }
    
    if prompt:
        data["prompt"] = prompt
    
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            GROQ_API_URL,
            headers=headers,
            files=files,
            data=data
        )
        
        if response.status_code != 200:
            detail = response.text
            try:
                j = response.json()
                detail = j.get("error", j)
            except Exception:
                pass
            raise Exception(f"Groq API error: {response.status_code} - {detail}")
        
        result = response.json()
        return {
            "text": result.get("text", ""),
            "language": result.get("language", language)
        }
