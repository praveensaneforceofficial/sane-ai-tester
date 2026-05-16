#!/usr/bin/env python3
"""Run database migrations (for ChromaDB)"""

import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.logger import get_logger
from ai.rag.vector_store import vector_store

logger = get_logger(__name__)

async def migrate():
    """Run migrations"""
    logger.info("📦 Running migrations...")
    
    # Get current collection info
    count = await vector_store.get_count()
    logger.info(f"Current documents in collection: {count}")
    
    # Add any migration logic here
    # For example, update metadata schema, add new fields, etc.
    
    logger.info("✅ Migrations complete!")

if __name__ == "__main__":
    asyncio.run(migrate())