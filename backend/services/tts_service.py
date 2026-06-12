"""Edge TTS service - free, high-quality Chinese text-to-speech."""

import asyncio
import base64
from typing import AsyncGenerator, Optional
import edge_tts
from config import settings


class TTSService:
    """Text-to-speech using Microsoft Edge free TTS engine."""

    def __init__(self):
        self.voice = settings.tts_voice
        self.rate = settings.tts_rate
        self.pitch = settings.tts_pitch

    async def stream_audio(
        self,
        text: str,
    ) -> AsyncGenerator[str, None]:
        """Generate TTS audio for text and yield base64-encoded MP3 chunks."""
        if not text.strip():
            return

        communicate = edge_tts.Communicate(
            text=text,
            voice=self.voice,
            rate=self.rate,
            pitch=self.pitch,
        )

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield base64.b64encode(chunk["data"]).decode("ascii")

    async def generate_full(
        self,
        text: str,
    ) -> Optional[str]:
        """Generate complete TTS audio and return as a single base64 string."""
        if not text.strip():
            return None

        communicate = edge_tts.Communicate(
            text=text,
            voice=self.voice,
            rate=self.rate,
            pitch=self.pitch,
        )

        audio_bytes = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_bytes += chunk["data"]

        if audio_bytes:
            return base64.b64encode(audio_bytes).decode("ascii")
        return None


# Singleton
tts_service = TTSService()
