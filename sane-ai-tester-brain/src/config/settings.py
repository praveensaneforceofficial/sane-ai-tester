from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # API Bridge
    API_URL: str = "http://uatai.saneforce.com"
    API_WS_URL: str = "ws://uatai.saneforce.com"
    
    # Brain Server
    BRAIN_PORT: int = 8000
    BRAIN_HOST: str = "0.0.0.0"
    DEBUG: bool = True
    
    # Zoho Configuration
    ZOHO_CLIENT_ID: str = ""
    ZOHO_CLIENT_SECRET: str = ""
    ZOHO_REFRESH_TOKEN: str = ""
    ZOHO_ORG_ID: str = ""
    ZOHO_API_BASE: str = "https://www.zohoapis.com/sprint/v1"
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_MAX_TOKENS: int = 4000
    
    # Ollama Configuration
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    OLLAMA_MAX_TOKENS: int = 4000
    
    # AI Settings
    AI_TEMPERATURE: float = 0.7
    AI_MAX_RETRIES: int = 3
    
    # ChromaDB
    CHROMA_DB_PATH: str = "./data/vector_db"
    CHROMA_COLLECTION_NAME: str = "test_cases"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/brain.log"
    LOG_MAX_SIZE: int = 10485760
    LOG_BACKUP_COUNT: int = 5
    
    # Scheduler
    ZOHO_POLL_INTERVAL: int = 60
    WORKER_HEALTH_INTERVAL: int = 30
    TASK_RETRY_INTERVAL: int = 300
    
    # Paths
    REPORT_PATH: str = "./data/reports"
    SCREENSHOT_PATH: str = "./data/screenshots"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()