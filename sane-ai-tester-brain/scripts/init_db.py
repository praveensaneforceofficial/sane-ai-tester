#!/usr/bin/env python3
"""Initialize ChromaDB and create necessary directories"""

import os
import sys
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

async def init_chromadb():
    """Initialize ChromaDB"""
    try:
        import chromadb
        from chromadb.config import Settings
        
        # Create directory if not exists
        os.makedirs(settings.CHROMA_DB_PATH, exist_ok=True)
        
        # Initialize client
        client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=settings.CHROMA_DB_PATH,
            anonymized_telemetry=False
        ))
        
        # Create collection if not exists
        try:
            collection = client.get_collection(settings.CHROMA_COLLECTION_NAME)
            logger.info(f"Collection '{settings.CHROMA_COLLECTION_NAME}' already exists")
        except:
            collection = client.create_collection(
                name=settings.CHROMA_COLLECTION_NAME,
                metadata={"description": "Test cases and reports for RAG"}
            )
            logger.info(f"Created collection '{settings.CHROMA_COLLECTION_NAME}'")
        
        logger.info(f"✅ ChromaDB initialized at {settings.CHROMA_DB_PATH}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize ChromaDB: {e}")
        return False

def init_directories():
    """Create necessary directories"""
    directories = [
        settings.REPORT_PATH,
        settings.SCREENSHOT_PATH,
        "./logs",
        "./data/vector_db",
        "./data/reports",
        "./data/screenshots"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"Directory created: {directory}")
    
    logger.info("✅ All directories created")

async def main():
    """Main initialization function"""
    logger.info("🚀 Initializing Sane-AI Brain...")
    
    # Create directories
    init_directories()
    
    # Initialize ChromaDB
    await init_chromadb()
    
    logger.info("✅ Initialization complete!")

if __name__ == "__main__":
    asyncio.run(main())