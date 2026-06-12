"""Application configuration management."""

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "AI 知心大姐姐"
    app_version: str = "1.0.0"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 8899

    # DeepSeek API
    deepseek_api_key: str = os.getenv("DEEPSEEK_API_KEY", "")
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    deepseek_max_tokens: int = 2048
    deepseek_temperature: float = 0.7

    # Database
    db_path: str = str(Path(__file__).parent / "data" / "ai_sister.db")

    # Encryption
    encryption_key_file: str = str(Path(__file__).parent / "data" / ".encryption_key")

    # Conversation
    max_history_messages: int = 20
    max_context_tokens: int = 4000

    # CORS
    cors_origins: str = os.getenv("CORS_ORIGINS", "")
    risk_detection_enabled: bool = True
    high_risk_auto_intervene: bool = True

    # TTS (Edge TTS)
    tts_voice: str = "zh-CN-XiaoxiaoNeural"
    tts_rate: str = "-5%"
    tts_pitch: str = "-3Hz"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
